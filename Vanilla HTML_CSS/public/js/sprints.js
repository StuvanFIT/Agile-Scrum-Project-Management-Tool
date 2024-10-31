import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";



//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, set, push, child, onValue, update, get, remove} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

import { setSprintActive } from "./activateSprint.js";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAg4NXpv6dHmmNqc-wAmJt4utArIpb9TbE",
    authDomain: "tunnelvision-f07f7.firebaseapp.com",
    databaseURL: "https://tunnelvision-f07f7-default-rtdb.firebaseio.com",
    projectId: "tunnelvision-f07f7",
    storageBucket: "tunnelvision-f07f7.appspot.com",
    messagingSenderId: "779720304073",
    appId: "1:779720304073:web:4e1e9e3cf3f1ecd337f418"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function getLoginDetails() {
    const userID = sessionStorage.getItem('userID');
    const userEmail = sessionStorage.getItem('userEmail');
    return { userID, userEmail };
}


function validateSprintInput(sprintTitle, sprintDesc, sprintStartDate, sprintEndDate){

    if (
        !sprintTitle || 
        !sprintDesc || 
        !sprintStartDate || 
        !sprintEndDate || 
        isNaN(Date.parse(sprintStartDate)) || 
        isNaN(Date.parse(sprintEndDate))
    ) {
        alert("Please fill in all fields correctly. Ensure that the dates are valid.");
        return true;
    }

    //So if the start and end dates arent empty, then we check if the dates are valid:
    const startDate = new Date(sprintStartDate);
    const endDate = new Date(sprintEndDate);

    if(startDate >endDate){
        alert("The Start Date is after the End Date. Please fix this!");
        return true;
    } else if(endDate < startDate){
        alert("The End Date is before the Start Date. Please Fix This!");
        return true;
    }
}

function formatDateToDDMMYYYY(string){


    const date = new Date(string);
   

    //Currently, the date is in the form of: Wed Sep 11 2024 10:00:00 GMT+1000 (Australian Eastern Standard Time)

    //Get the Day: turn it into a string, then modify 
    const day =  String(date.getDate()).padStart(2,'0');
    //Get the month: note that month are 0-indexed so we add 1
    const month = String((date.getMonth() +1)).padStart(2,'0');

    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
}

function formatDateToYYYYMMDD(string) {
    // Split the formatted date into components
    const [day, month, year] = string.split('/');

    // Create the original date string in the format YYYY-MM-DD
    return `${year}-${month}-${day}`;
}



function showProductLogOptions(container_string='task-selection-container'){
    const dbRef = ref(database, 'product-backlog/');
            
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        const dataArray = [];
        
        if (data) {
            for (const key in data) {
                data[key].taskId = key;  // Add the Firebase key to the task data
                dataArray.push(data[key]);
            }
        }
  
        //Display the product backlog options to the edit sprint screen
        
        showProductLogOptions_aux(dataArray, container_string);


    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

function showProductLogOptions_aux(tasks, container_string){

    const taskContainer = document.getElementById(container_string);

    taskContainer.innerHTML = ''; // Clear previous options

    taskContainer.style.display = 'flex';
    taskContainer.style.flexWrap = 'wrap';
    taskContainer.style.gap = '20px 10px';

    const styles = `
        <style>
            .custom-checkbox {
                width: 20px;
                height: 20px;
                background-color: white;
                border: 2px solid #2B2D42;
                border-radius: 5px;
                display: inline-block;
                position: relative;
                cursor: pointer;
            }

            label input[type="checkbox"]:checked + .custom-checkbox {
                background-color: black;
            }

            label input[type="checkbox"]:checked + .custom-checkbox::after {
                content: '';
                position: absolute;
                left: 4px;
                top: 0px;
                width: 8px;
                height: 14px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        </style>
    `;

    taskContainer.innerHTML += styles;
    
    tasks.forEach(task => {
 
        //Only one task can be assigned to a sprint
        if (task.assignedToSprint == 'None'){
            const taskOption = document.createElement('div');
            taskOption.innerHTML = `
                <div style="background-color: white; display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 20px;
                height: 100px;
                width: 268px;
                border: 1px solid black;
                ">
                    <label style="display: flex; flex-direction: column; align-items: center; justify-content: center">
                        <span>${task.val1_title}</span><br> 
                        <input type="checkbox" id="${task.taskId}" name="available-task" value="${task.taskId}" style="display: none;">
                        <span class="custom-checkbox"></span>
                    </label>
                </div>
            `;
            
            taskContainer.appendChild(taskOption);
        }

    });
  
    
}



// Function to open the popup
function openViewSprint() {
    const popup = document.getElementById("curr-sprints-popup");
    popup.style.display = 'flex'; 
}

// Function to close the popup
function closeViewSprint() {
    const popup = document.getElementById("curr-sprints-popup");
    popup.style.display = 'none'; 
}

function showAssignees(taskID,sprint) {
    const taskRef = ref(database, 'product-backlog/' + taskID);

    get(taskRef).then(snapshot => {
        if (snapshot.exists()) {
            const taskDetails = snapshot.val();
            let curr_member_assigned = taskDetails.assignee;


            console.log(taskDetails)

            // Now, after getting the assignee, fetch user accounts
            populateAssigneeOptions(curr_member_assigned, taskID,sprint);
        }
    });
}

function populateAssigneeOptions(curr_member_assigned, taskID,sprint) {
    const assigneeSelect = document.getElementById(`edit-assignee-${taskID}`);

    // Clear existing options to avoid duplicates
    assigneeSelect.innerHTML = '';
    const none = document.createElement('option');
                
    none.value = 'No-Assignee';
    none.textContent = "No-Assignee";

    assigneeSelect.appendChild(none);

    const sprintRef = ref(database, 'sprint-log/' + sprint.taskId);

    get(sprintRef).then(snapshot => {
        if (snapshot.exists()) {
            const members = snapshot.val().v7_sprintMembers;

            console.log(members);

            members.forEach(member => {
                console.log(member)

                const option = document.createElement('option');
                
                option.value = member.email;
                option.textContent = member.email;

                assigneeSelect.appendChild(option);
            });

            // Check if curr_member_assigned is in members
            const memberEmails = members.map(member => member.email); // Get an array of member emails
            if (curr_member_assigned && memberEmails.includes(curr_member_assigned)) {
                assigneeSelect.value = curr_member_assigned; // Set the value if it exists in members
            }else{
                assigneeSelect.value = "No-Assignee";

                //update assignee of task in databse
                const taskRef = ref(database, `product-backlog/${taskID}`); // Adjust the path according to your database structure
                update(taskRef, {
                    assignee: 'No-Assignee' // Update the assignee to No-Assignee
                }).then(() => {
                    console.log(`Assignee for task ${taskID} updated to No-Assignee`);
                }).catch(error => {
                    console.error("Error updating assignee:", error);
                });

            }



        }
    });
}






function showMoveTaskOptions(sprint,taskID){


    // Find the select element for the current task
    const selectElement = document.getElementById(`sprint-selector-${taskID}`);


    // Clear existing options, except for the default option
    while (selectElement.options.length > 1) {
        selectElement.remove(1); // Remove options starting from index 1 (keep the first option)
    }

    // Create and append the new option to move back to product backlog
    const option = document.createElement("option");
    option.value = 'product-backlog'; 
    option.text = "Product Backlog"; 
    selectElement.appendChild(option); 


 

    const curr_sprintID = sprint.taskId;


    const sprintRef = ref(database, 'sprint-log');
   

    onValue(sprintRef, (snapshot) =>{

        const all_sprints = snapshot.val();
        console.log(all_sprints)

        if (all_sprints) {
            // Iterate through all sprints
            for (const sprintID in all_sprints) {
                console.log(sprintID)
                console.log(curr_sprintID)

                const currSprintRef = ref(database, 'sprint-log/'+sprintID);

                get(currSprintRef).then(snapshot=>{

                    if (snapshot.exists()){

                        const sprintDetails =snapshot.val();

                                
                        if (sprintID !== curr_sprintID && sprintDetails.v6_SprintStatus !== "Completed" && sprintDetails.v6_SprintStatus !== "In Progress"){
                            console.log("THE CURRENT SPRINT ID")
                            const sprintName = all_sprints[sprintID].v1_sprintTitle; 
                            console.log(sprintName)

    
                            // Create and append the new option for the sprint
                            const option = document.createElement("option");
                            option.value = sprintID; //Sprint ID AS THE OTPTION
                            option.text = sprintName; //Sprint name as the OPTION NAME THE CLIENT SEES
                            selectElement.appendChild(option); 
                        }

                    }


                })

            }
        }
    });
}




function noTaskSaveSprint(sprint) {

    // Get the current edit entries of the edit form:
    const newTitle = document.getElementById(`edit-sprint-title-${sprint.v1_sprintTitle}`).value;
    const newDesc = document.getElementById(`edit-sprint-desc-${sprint.v2_sprintDesc}`).value;
    const newStartDate = document.getElementById(`no-task-edit-start-date-${sprint.v3_sprintStartDate}`).value;
    const newEndDate = document.getElementById(`no-task-edit-end-date-${sprint.v4_sprintEndDate}`).value;

    // Get selected assignees
    const checkedAssignees = document.querySelectorAll('input[name="assignees"]:checked');
    const sprintAssignees = Array.from(checkedAssignees).map(assignee => JSON.parse(assignee.value));

    console.log(sprintAssignees);

    // Validate the sprint input
    if (validateSprintInput(newTitle, newDesc, newStartDate, newEndDate)) {
        return;
    }

    // Get selected tasks
    const checkedTasks = document.querySelectorAll('input[name="available-task"]:checked');
    let sprintTaskIDs = Array.from(checkedTasks).map(task => task.value);
    
    // Set to null if no tasks selected
    if (sprintTaskIDs.length === 0) {
        sprintTaskIDs = null;
    }

    const sprintRef = ref(database, 'sprint-log/' + sprint.taskId);

    get(sprintRef).then((snapshot) => {
        const sprintDetails = snapshot.val();
        if (sprintDetails) {

            const currentMembers = sprintDetails.v7_sprintMembers || [];
            //Change the user account in sprint status to FALSE for previous tasks that werent checked
            // Identify old assignees who need to have their inSprint status set to false
            const oldAssignees = currentMembers.filter(member => 
                !sprintAssignees.some(newMember => newMember.userID === member.userID)
            );

            // Update inSprint status to false for old assignees
            oldAssignees.forEach(member => {
                const userRef = ref(database, 'user-accounts/' + member.userID);
                update(userRef, {
                    inSprint: false
                });
            });
    
        }
    
    });



    // Update assignees' inSprint field in the database
    sprintAssignees.forEach(assignee => {
        assignee.inSprint = true;

        const userRef = ref(database, 'user-accounts/' + assignee.userID);
        update(userRef, { inSprint: true })
        .catch(error => {
            console.error(`Error updating user ${assignee.userID}:`, error);
        });
    });

    // Get the sprint reference and save the sprint details
    const sprRef = ref(database, 'sprint-log/' + sprint.taskId);
    update(sprRef, {
        v1_sprintTitle: newTitle,
        v2_sprintDesc: newDesc,
        v3_sprintStartDate: formatDateToDDMMYYYY(newStartDate),
        v4_sprintEndDate: formatDateToDDMMYYYY(newEndDate),
        v5_allocatedTasks: sprintTaskIDs,
        v6_SprintStatus: "Not Started", // Default is Not Started
        v7_sprintMembers: sprintAssignees
    }).then(() => {
        alert('Saved Sprint into the Database');
        
        // Optionally, remove tasks from the log if needed
        if (sprintTaskIDs) {
            removeTasksFromLog(sprintTaskIDs, sprint.taskId);
        }
    }).catch((error) => {
        console.error('Error saving sprint:', error);
    });
}




//Global Variable to prevent multiple entries whne pressing button once.
let moving_task = false;





function viewNoTaskSprint(sprint) {

    // Show the popup
    openViewSprint();

    const sprintDetailsContainer = document.getElementById("sprint-details-container");
    sprintDetailsContainer.innerHTML = ''; 

    const xHolder = document.createElement('div');
    xHolder.style.display = 'flex';
    xHolder.style.justifyContent = 'flex-end';
    xHolder.innerHTML = '';

    const closeX = document.createElement('span');
    closeX.id = 'close-curr-sprints-btn';
    closeX.style.color = 'black';
    closeX.innerHTML = '&times;';
    closeX.style.cursor = 'pointer';
    closeX.style.fontWeight = 'bold';
    closeX.style.fontSize = '28px';

    // Add the click event listener for closeX
    closeX.addEventListener('click', closeViewSprint); // Replace with your close function

    xHolder.appendChild(closeX);
    sprintDetailsContainer.appendChild(xHolder);
    
  

    // Create a flex container to hold both LHS and RHS
    const sprintPopupContainer = document.createElement("div");
    sprintPopupContainer.style.display = 'flex';
    sprintPopupContainer.style.justifyContent = 'space-between';
    sprintPopupContainer.style.padding = '10px';
    sprintPopupContainer.style.marginBottom = '10px';
    sprintPopupContainer.style.width = '100%'; 
    sprintPopupContainer.style.boxSizing = 'border-box';
    sprintPopupContainer.style.backgroundColor = 'white';

    // Create the LHS for tasks list
    const taskListContainer = document.createElement("div");
    taskListContainer.id = "lhs-container";
    taskListContainer.style.display = 'flex';  
    taskListContainer.style.flexWrap = 'wrap';    
    taskListContainer.style.fontSize = '12px';  
    taskListContainer.style.width = '65%';
    taskListContainer.style.height = '80%';


    // Create the RHS for sprint edit form
    const editSprintContainer = document.createElement("div");
    editSprintContainer.style.flex = '1';  
    editSprintContainer.style.paddingLeft = '20px';
    editSprintContainer.style.backgroundColor = 'white';
    editSprintContainer.style.borderRadius = '5px';
    editSprintContainer.style.width = '80%';
    

    console.log(formatDateToYYYYMMDD(sprint.v3_sprintStartDate))
    console.log(sprint)
    // Add sprint edit form
    editSprintContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <label style="color: black;">Title</label>
            <input type="text" style="color: black;" id="edit-sprint-title-${sprint.v1_sprintTitle}" value="${sprint.v1_sprintTitle}" />

            <label style="color: black;">Description</label>
            <input type="text" style="color: black;" id="edit-sprint-desc-${sprint.v2_sprintDesc}" value="${sprint.v2_sprintDesc}" />

            <label style="color: black;">Start Date</label>
            <input type="date" style="color: black;" id="no-task-edit-start-date-${sprint.v3_sprintStartDate}" value="${formatDateToYYYYMMDD(sprint.v3_sprintStartDate)}" />

            <label style="color: black;">End Date</label>
            <input type="date" style="color: black;" id="no-task-edit-end-date-${sprint.v4_sprintEndDate}" value="${formatDateToYYYYMMDD(sprint.v4_sprintEndDate)}" />

           
            <label for="assignee">Select Assignees:</label>
            <div id="assignee-no-task" name="assignee-no-task" style="margin-bottom: 20px;">
            
            </div>

      


            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button id="no-task-save-sprint-details-${sprint.taskId}" class="saving-no-task" style="width: 50%; padding: 10px 10px;">Save</button>
                <button id="no-task-delete-sprint-${sprint.taskId}" class="deleting-no-task" style="width: 50%; padding: 10px 10px;">Delete</button>
            </div>
        </div>
    `;

 
    //Append the lhs and rhs to the entire container:
    sprintPopupContainer.appendChild(taskListContainer);
    sprintPopupContainer.appendChild(editSprintContainer);

    //Append the entire container to the html code:
    sprintDetailsContainer.appendChild(sprintPopupContainer);


    showProductLogOptions(taskListContainer.id);
 
    showAssigneesNoTask(sprint); 
   

    const saveButton = document.getElementById(`no-task-save-sprint-details-${sprint.taskId}`);
    saveButton.addEventListener('click', function() {
        noTaskSaveSprint(sprint);
        closeViewSprint();

        setTimeout(() => {
            showAssigneesNewTask(); 
        }, 1500);

    });

    const delButton = document.getElementById(`no-task-delete-sprint-${sprint.taskId}`);
    delButton.addEventListener('click', function() {
        removeSprintFromLog(sprint.taskId);
        closeViewSprint();

        setTimeout(() => {
            showAssigneesNewTask(); 
        }, 1500);
         
    });


}


//Not started sprint cards taht do not have tasks:
function showAssigneesNoTask(sprint) {
    const assigneeList = document.getElementById('assignee-no-task');
    assigneeList.innerHTML = ''; // Clear previous options

    const userAccountRef = ref(database, 'user-accounts');
    const currSprintRef = ref(database, 'sprint-log/' + sprint.taskId);

    // Dynamically create a <style> tag for custom checkbox styles (if not already added)
    if (!document.getElementById('custom-checkbox-style')) {
        const style = document.createElement('style');
        style.id = 'custom-checkbox-style'; // Add an ID to avoid duplicating the style tag
        style.innerHTML = `
            .custom-checkbox {
                width: 20px;
                height: 20px;
                background-color: white;
                border: 2px solid #2B2D42;
                border-radius: 5px;
                display: inline-block;
                position: relative;
                cursor: pointer;
            }

            div input[type="checkbox"]:checked + .custom-checkbox {
                background-color: black;
            }

            div input[type="checkbox"]:checked + .custom-checkbox::after {
                content: '';
                position: absolute;
                left: 4px;
                top: 0px;
                width: 8px;
                height: 14px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        `;
        document.head.appendChild(style); // Append the <style> tag to the <head>
    }

    // Get current sprint members
    get(currSprintRef).then(sprintSnapshot => {
        if (sprintSnapshot.exists()) {
            const currentMembers = sprintSnapshot.val().v7_sprintMembers || [];
            const currentMemberIDs = new Set(currentMembers.map(member => member.userID)); // Use Set for easy lookup

            // Get all user accounts
            get(userAccountRef).then(userSnapshot => {
                if (userSnapshot.exists()) {
                    const userIDData = userSnapshot.val();

                    for (let userID in userIDData) {
                        const currUser = userIDData[userID];

                        // Check if the user is part of the current sprint
                        const isAssigned = currentMemberIDs.has(userID);
                        
                        // Check if the user is not part of any sprint
                        console.log(currUser)
                        const inSprint = currUser.inSprint;

                        // Only show the user if they are not in any sprint or they are in the current sprint
                        if (!inSprint || isAssigned) {
                            const item = document.createElement('div');
                            item.style.display = 'flex';
                            item.style.alignItems = 'center';
                            item.style.marginBottom = '8px';
                            item.style.position = 'relative'; // Needed for custom checkbox positioning

                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.value = JSON.stringify(currUser); 
                            checkbox.name = 'assignees';
                            checkbox.style.marginRight = '10px'; // Spacing between checkbox and label
                            checkbox.style.opacity = '0'; // Hide the default checkbox visually
                            checkbox.checked = isAssigned; // Check if assigned to the current sprint

                            // Create the label and the span for custom checkbox
                            const label = document.createElement('label');
                            label.textContent = currUser.email;
                            label.style.marginLeft = '10px'; // Spacing between custom checkbox and label
                            label.style.fontSize = '14px'; // Set font size
                            label.style.fontWeight = '400'; // Set font weight to normal

                            const customCheckbox = document.createElement('span');
                            customCheckbox.classList.add('custom-checkbox');

                            // Set the background color based on the checked state
                            customCheckbox.style.backgroundColor = checkbox.checked ? 'black' : 'white';

                            // Append checkbox and label with custom styling
                            item.appendChild(checkbox);
                            item.appendChild(customCheckbox);
                            item.appendChild(label);
                            assigneeList.appendChild(item);

                            // Add click event to custom checkbox to toggle the actual checkbox
                            customCheckbox.addEventListener('click', () => {
                                checkbox.checked = !checkbox.checked;
                                customCheckbox.style.backgroundColor = checkbox.checked ? 'black' : 'white'; // Change background color based on checked state
                            });
                        }
                    }
                }
            });
        }
    });
}





function taskSaveSprint(sprint, taskID){

    //sprint: Sprint the task is apart of and taskID: the task being edited
    console.log(sprint)
    console.log(taskID)
    //Get the current edit entries of the edit form:
    const newTitle = document.getElementById(`edit-title-${taskID}`).value;
    const newDesc = document.getElementById(`edit-desc-${taskID}`).value;

    let newTags = [];
    //Grab the updated tags
    console.log(document.getElementById(`edit-tag-${taskID}`).options)
    for (let i=0; i<(document.getElementById(`edit-tag-${taskID}`).options).length; i++){

        const option = document.getElementById(`edit-tag-${taskID}`).options[i];

        if (document.getElementById(`edit-tag-${taskID}`).options[i].selected){
            newTags.push(option.value);
        }
    }
    const newPoints = document.getElementById(`edit-points-${taskID}`).value;
    const newPriority = document.getElementById(`edit-priority-${taskID}`).value;
    const newStage = document.getElementById(`edit-stage-${taskID}`).value;
    const newStatus = document.getElementById(`edit-status-${taskID}`).value;

    const newAssignee = document.getElementById(`edit-assignee-${taskID}`).value;

    const taskRef = ref(database, 'product-backlog/' + taskID);


   // Get current task details
    get(taskRef).then((snapshot) => {
       if (snapshot.exists()) {
           const taskDetails = snapshot.val();

           // Prepare the updated task object
           const updatedTask = {
               assignee: newAssignee,
               accumulatedEffort: taskDetails.accumulatedEffort, 
               assignedToSprint: taskDetails.assignedToSprint, 
               val1_title: newTitle,
               val2_desc: newDesc,
               val3_tag: newTags,
               val4_priority: newPriority,
               val5_points: newPoints,
               val6_stage: newStage,
               val7_status: newStatus,
           };

           // Update the task in the database
           update(taskRef, updatedTask)
               .then(() => {
                   console.log(`Task successfully updated`);


                   //If a sprint was selected to move the task to the target sprint:
                   const target_sprint = document.getElementById(`sprint-selector-${taskID}`).value;
                   console.log(target_sprint)
                   if (target_sprint){
                    moveTaskAnotherSprint(taskID,sprint);
                    
                   }

                    task_edit_history(taskID)
                    //Then, close the view sprint details screen:
                    closeViewSprint();
                    
                    //location.reload(); this gets rid of the task, dont use it
      
               })
               .catch((error) => {
                   console.error("Error updating task:", error);
                   
               });
       } else {
           console.error("No data available for task:", taskID);
       }
   })
   .catch((error) => {
       console.error("Error fetching task data:", error);
   });


}

//Not started sprint card has tasks
function showAssigneesHasTask(sprint) {
    const assigneeList = document.getElementById('assignee-has-task');
    assigneeList.innerHTML = ''; // Clear previous options

    const userAccountRef = ref(database, 'user-accounts');
    const currSprintRef = ref(database, 'sprint-log/' + sprint.taskId);

    // Dynamically create a <style> tag for custom checkbox styles if not already added
    if (!document.getElementById('custom-checkbox-style')) {
        const style = document.createElement('style');
        style.id = 'custom-checkbox-style'; // Ensure no duplication of style tag
        style.innerHTML = `
            .custom-checkbox {
                width: 20px;
                height: 20px;
                background-color: white;
                border: 2px solid #2B2D42;
                border-radius: 5px;
                display: inline-block;
                position: relative;
                cursor: pointer;
            }

            div input[type="checkbox"]:checked + .custom-checkbox {
                background-color: black;
            }

            div input[type="checkbox"]:checked + .custom-checkbox::after {
                content: '';
                position: absolute;
                left: 4px;
                top: 0px;
                width: 8px;
                height: 14px;
                border: solid white;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg);
            }
        `;
        document.head.appendChild(style); // Append the <style> tag to the <head>
    }

    // Get current sprint members
    get(currSprintRef).then(sprintSnapshot => {
        if (sprintSnapshot.exists()) {
            const currentMembers = sprintSnapshot.val().v7_sprintMembers || [];
            const currentMemberIDs = new Set(currentMembers.map(member => member.userID)); // Use a Set for quick lookup

            // Get all user accounts
            get(userAccountRef).then(userSnapshot => {
                if (userSnapshot.exists()) {
                    const userIDData = userSnapshot.val();
                    const createdEmails = new Set(); // To track emails that have already been added

                    for (let userID in userIDData) {
                        const currUser = userIDData[userID];
                        const isAssigned = currentMemberIDs.has(userID); // Check if the user is in the current sprint

                        // Only show members who are either in the current sprint or not in any sprint
                        if (!currUser.inSprint || isAssigned) {
                            // Check if the user's email is already in the list
                            if (!createdEmails.has(currUser.email)) {
                                const item = document.createElement('div');
                                item.style.display = 'flex';
                                item.style.alignItems = 'center';
                                item.style.marginBottom = '8px';
                                item.style.position = 'relative'; // Needed for custom checkbox positioning

                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.value = JSON.stringify(currUser);
                                checkbox.name = 'assignees';
                                checkbox.style.marginRight = '10px'; // Spacing between checkbox and label
                                checkbox.style.opacity = '0'; // Hide the default checkbox visually
                                checkbox.checked = isAssigned; // Check if the user is already assigned to the sprint

                                // Create the label and the span for custom checkbox
                                const label = document.createElement('label');
                                label.textContent = currUser.email;
                                label.style.marginLeft = '10px'; // Spacing between custom checkbox and label
                                label.style.fontSize = '14px'; // Set font size to smaller
                                label.style.fontWeight = '400'; // Set font weight to lighter (normal)

                                const customCheckbox = document.createElement('span');
                                customCheckbox.classList.add('custom-checkbox');
                                customCheckbox.style.backgroundColor = checkbox.checked ? 'black' : 'white';

                                // Append checkbox and label with custom styling
                                item.appendChild(checkbox);
                                item.appendChild(customCheckbox);
                                item.appendChild(label);
                                assigneeList.appendChild(item);

                                // Add click event to custom checkbox to toggle the actual checkbox
                                customCheckbox.addEventListener('click', () => {
                                    checkbox.checked = !checkbox.checked;
                                    customCheckbox.style.backgroundColor = checkbox.checked ? 'black' : 'white'; // Change background color based on checked state
                                });

                                createdEmails.add(currUser.email); // Mark this email as added
                            }
                        }
                    }
                }
            });
        }
    });
}


// Close popup when close button is clicked
document.getElementById('close-curr-sprints-btn').addEventListener('click', closeViewSprint);


let hasShownAssignees = false
function viewSprintDetails(sprint) {

    // Show the popup
    openViewSprint();

    const sprintDetailsContainer = document.getElementById("sprint-details-container");
    sprintDetailsContainer.innerHTML = ''; // Clear the current sprint details.
    sprintDetailsContainer.style.display = 'flex';
    sprintDetailsContainer.style.flexDirection = 'column';

    const xHolder = document.createElement('div');
    xHolder.style.display = 'flex';
    xHolder.style.justifyContent = 'flex-end';
    xHolder.innerHTML = '';

    const closeX = document.createElement('span');
    closeX.id = 'close-curr-sprints-btn';
    closeX.style.color = 'black';
    closeX.innerHTML = '&times;';
    closeX.style.cursor = 'pointer';
    closeX.style.fontWeight = 'bold';
    closeX.style.fontSize = '28px';

    // Add the click event listener for closeX
    closeX.addEventListener('click', closeViewSprint); // Replace with your close function

    xHolder.appendChild(closeX);
    sprintDetailsContainer.appendChild(xHolder);

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '9px'
    buttonContainer.style.marginTop = '20px';

    // Create Save Button
    const saveMoreTasks_btn = document.createElement("button");
    saveMoreTasks_btn.innerText = "Save";
    saveMoreTasks_btn.style.padding = '10px 10px';
    saveMoreTasks_btn.style.backgroundColor = '#2C2C54'; // kinda dark green lol
    saveMoreTasks_btn.style.color = 'white';
    saveMoreTasks_btn.style.border = 'none';
    saveMoreTasks_btn.style.borderRadius = '10px';
    saveMoreTasks_btn.style.cursor = 'pointer';
    saveMoreTasks_btn.style.width = '50%';

 
    // Create Delete Button
    const del_btn = document.createElement("button");
    del_btn.innerText = "Delete";
    del_btn.style.padding = '10px 10px';
    del_btn.style.backgroundColor = '#DB162F'; // light red
    del_btn.style.color = 'white';
    del_btn.style.border = 'none';
    del_btn.style.borderRadius = '10px';
    del_btn.style.cursor = 'pointer';
    del_btn.style.width = '50%';


    // Append buttons to button container
    buttonContainer.appendChild(saveMoreTasks_btn);
    buttonContainer.appendChild(del_btn);
    

    // Create a flex container to hold both LHS and RHS
    const sprintPopupContainer = document.createElement("div");
    sprintPopupContainer.style.display = 'flex';
    sprintPopupContainer.style.justifyContent = 'space-between';
    sprintPopupContainer.style.padding = '10px';
    sprintPopupContainer.style.marginBottom = '10px';
    sprintPopupContainer.style.width = '100%'; 
    sprintPopupContainer.style.boxSizing = 'border-box';
    sprintPopupContainer.style.backgroundColor = 'white';

    //the lhs title is in the showProductOptionsAux


    // Create the LHS for the product backlog tasks
    const taskListContainer = document.createElement("div");
    taskListContainer.id = "lhs-container";
    taskListContainer.style.display = 'flex';  
    taskListContainer.style.flexWrap = 'wrap';    
    taskListContainer.style.fontSize = '12px';  
    taskListContainer.style.width = '65%';
    taskListContainer.style.height = '80%';


    //Create the middle section where we show all members:
    const membersListContainer = document.createElement("div");
    membersListContainer.id = "middle-container";
    membersListContainer.style.width = '70%';
    membersListContainer.style.height = '50%';

    // Create label for assignee selection
    const assigneeLabel = document.createElement("label");
    assigneeLabel.setAttribute("for", "assignee-no-task");
    assigneeLabel.innerText = "Select Assignees:";
    // assigneeLabel.style.fontWeight = 'bold';  // Making label stand out
    membersListContainer.appendChild(assigneeLabel);

    // Create a container for available assignees
    const assigneeContainer = document.createElement("div");
    assigneeContainer.id = "assignee-has-task";
    assigneeContainer.style.display = 'flex';
    assigneeContainer.style.flexWrap = 'wrap'; 
    assigneeContainer.style.gap = '5px';  
    assigneeContainer.style.marginTop = '10px';  
    membersListContainer.appendChild(assigneeContainer);

    








    // Create the RHS for sprint edit form
    const editSprintContainer = document.createElement("div");
    editSprintContainer.style.flex = '1';  
    editSprintContainer.style.paddingLeft = '45px';
    editSprintContainer.style.backgroundColor = 'white';
    editSprintContainer.style.borderRadius = '5px';
    editSprintContainer.style.width = '80%';

    const rhsTitle = document.createElement("h2");
    rhsTitle.innerText = "Tasks in Sprint";
    editSprintContainer.appendChild(rhsTitle);





    // For sprint card with tasks:
    if (sprint.hasOwnProperty('v5_allocatedTasks')) {
        sprint.v5_allocatedTasks.forEach(taskID => {
            // Create reference to the task in the product backlog
            const taskRef = ref(database, 'product-backlog/' + taskID);

            onValue(taskRef, (snapshot) => {
                const taskDetails = snapshot.val();
                if (taskDetails) {

                    const taskDivElement = document.getElementById(`tasking-${taskID}`);

                    if(taskDivElement){
                        taskDivElement.innerHTML ='';
                    }

                    //css for the task div task rows on the RHS
                    const taskDiv = document.createElement("div");
                    taskDiv.id =`tasking-${taskID}`;
                    taskDiv.style.display = 'flex';
                    taskDiv.style.justifyContent = 'flex-start';
    
    
                    

                    const title = taskDetails.val1_title;
                    const desc = taskDetails.val2_desc;
                    const tag = taskDetails.val3_tag;
                    const priority = taskDetails.val4_priority;
                    const points = taskDetails.val5_points;
                    const stage = taskDetails.val6_stage;
                    const status = taskDetails.val7_status;



                    taskDiv.innerHTML = `
                        

                        <div class="task-actions">
                            <div class="task-item">${title}</div>
                            <img class="three-dots-btn" id="three-dots-btn-${taskID}" src="Images/edit_icon.png" style="width: 20px; height: 20px; cursor: pointer;"></img>
                            
                            <div class="move-tasks-modal" id="move-tasks-modal-${taskID}">
                                <div class="move-tasks-modal-content">
                                    <button id="close-three-dots-btn-${taskID}" class="close-three-dots-btn">&times;</button>

                                    <label>Move To</label>
                                    <select id="sprint-selector-${taskID}">
                                        <option value="">Select Sprint</option>
                                        <!-- Add existing sprints -->
                                    </select>
                                    
                                    
                                <div class="edit-task-modal-content">

                                    <label>Title</label>
                                    <input type="text" id="edit-title-${taskID}" value="${title}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;"/>

                                    <label>Description</label>
                                    <input type="text" id="edit-desc-${taskID}" value="${desc}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;"/>

                                    <label>Tag</label>
                                    <select id="edit-tag-${taskID}" name="tag[]" multiple="multiple" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;">
                                        <option value="front-end">Front End</option>
                                        <option value="back-end">Back End</option>
                                        <option value="API">API</option>
                                        <option value="Databases">Databases</option>
                                        <option value="Framework">Framework</option>
                                        <option value="Testing">Testing</option>
                                        <option value="UI">UI</option>
                                        <option value="UX">UX</option>
                                    </select>

                                    <label>Priority</label>
                                    <select id="edit-priority-${taskID}" required style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;">
                                        <option value="Low" ${priority === 'Low' ? 'selected' : ''}>Low</option>
                                        <option value="Medium" ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                        <option value="Important" ${priority === 'Important' ? 'selected' : ''}>Important</option>
                                        <option value="Urgent" ${priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                                    </select>


                                    <label>Story Points</label>
                                    <select id="edit-points-${taskID}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;" required>
                                        ${[...Array(11).keys()].map(i => `<option value="${i}" ${points == i ? 'selected' : ''}>${i}</option>`).join('')}
                                    </select>


                                    <label>Current Stage</label>
                                    <select id="edit-stage-${taskID}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;" required>
                                        <option value="planning" ${stage === 'planning' ? 'selected' : ''}>Planning</option>
                                        <option value="development" ${stage === 'development' ? 'selected' : ''}>Development</option>
                                        <option value="testing" ${stage === 'testing' ? 'selected' : ''}>Testing</option>
                                        <option value="integration" ${stage === 'integration' ? 'selected' : ''}>Integration</option>
                                    </select>

                                    <label>Assignee</label>
                                    <select id="edit-assignee-${taskID}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;" required>
                                 
                                    </select>


                                    <label>Status</label>
                                    <select id="edit-status-${taskID}" style="width: 100%; 
                                    padding: 10px;
                                    margin-bottom: 20px;
                                    border: 1px solid black; 
                                    border-radius: 5px; 
                                    background-color:white;
                                    box-sizing: border-box;" required>
                                    <option value="Not Started" ${status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                    <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
                                    </select>

                                    



                                    
                                </div>
                                <button id="save-edit-btn-${taskID}">Save</button>
                                </div>
                            </div>


                           
                        </div> 
                    `;


                    $(document).ready(function() {
                        $(`#edit-tag-${taskID}`).select2(); 
                        $(`#edit-tag-${taskID}`).val(tag).trigger('change');
                    });

                    // CSS for the three-dot button and popup
                    const css = `

                        .move-tasks-modal {
                            display: none; 
                            position: fixed; 
                            z-index: 1000; 
                            left: 0;
                            top: 0;
                            width: 100%; 
                            height: 100%; 
                            background-color: rgba(0, 0, 0, 0.5); 
                        }

                        .move-tasks-modal-content {
                            position: fixed; /* Fix the position relative to the viewport */
                            top: 50%; /* Center vertically */
                            left: 50%; /* Center horizontally */
                            transform: translate(-50%, -50%); /* Offset by 50% of width and height */
                            width: 100%; /* Responsive width */
                            max-width: 500px; /* Max width for larger screens */
                            max-height: 60vh; /* Max height of 80% viewport height */
                            overflow-y: auto; /* Enable vertical scrolling if content overflows */
                            padding: 20px;
                            border-radius: 10px; 
                            width: 400px; 
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); 
                            z-index: 10000;
                            background-color: white;
                        }

                        .task-menu.show {
                            display: block; 
                        }

                        .task-menu button,
                        .task-menu select {
                            width: 100%;
                            margin-top: 10px;
                            background-color: #2C2C54; 
                            color: white;
                            border: none;
                            padding: 10px; 
                            border-radius: 3px;
                            cursor: pointer;
                        }

                        .task-menu button:hover {
                            background-color: #3B3B6F; 
                        }

                        #close-three-dots-btn-${taskID} {
                            position: absolute;
                            top: 10px; 
                            right: 5px; 
                            background: none;
                            border: none;
                            font-size: 20px;
                            cursor: pointer;
                            color: black; 
                        }
                        #save-edit-btn-${taskID} {
                            background-color: #2C2C54;
                            color: white;
                            border: none;
                            padding: 12px;
                            cursor: pointer;
                            border-radius: 5px;
                            width: 100%;
                        }

                        #save-edit-btn-${taskID}:hover {
                            background-color: #6466e8; 
                        }

    


                    `;

                    // Inject CSS to the document head
                    const styleSheet = document.createElement("style");
                    
                    styleSheet.innerText = css;
                    document.head.appendChild(styleSheet);


                    // Append the task row to the RHS container:
                    editSprintContainer.appendChild(taskDiv);

                    //showMoveTaskOptions(sprint, taskID);
                }
            });


    


            //Append the lhs and rhs to the entire container:
            sprintPopupContainer.appendChild(taskListContainer);
            editSprintContainer.appendChild(membersListContainer);
            sprintPopupContainer.appendChild(editSprintContainer);
            
            
            //Append the entire container to the html code:
            sprintDetailsContainer.appendChild(sprintPopupContainer);
            editSprintContainer.appendChild(buttonContainer);

            //Show the available sprints that task is able to move to (this includes the product backlog)
            showMoveTaskOptions(sprint, taskID);
            //Show the available tasks in the prodcut backlog
            showProductLogOptions(taskListContainer.id);
            
            showAssignees(taskID,sprint);
            
            // Only show assigneesHasTask once
            if (!hasShownAssignees) {
                console.log("NICE")
                hasShownAssignees = true; // Set the flag to true after running the function
                showAssigneesHasTask(sprint);

                setTimeout(() => {
                    hasShownAssignees = false;
                }, 1500);
            }
                    


            

            saveMoreTasks_btn.onclick = function() {
                // Alert for testing purposes
                //alert("Save functionality not implemented.");
            
                const sprRef = ref(database, 'sprint-log/' + sprint.taskId);


                const checkedTasks = document.querySelectorAll('input[name="available-task"]:checked');
                const checkedMembers = document.querySelectorAll('input[name="assignees"]:checked')
                
                
                let sprintTaskIDs = Array.from(checkedTasks).map(task => task.value);
                let sprintAssignees = Array.from(checkedMembers).map(assignee => JSON.parse(assignee.value));

                console.log(sprintAssignees)

                console.log("SAVE");
                console.log(sprintTaskIDs);
            
                
                if (sprintTaskIDs.length === 0) {
                    sprintTaskIDs = null;
                }


                //Change the suer account in sprint status to TRUE for checked tasks:
                sprintAssignees.forEach(member =>{
                    const userRef = ref(database, 'user-accounts/' + member.userID);
                    update(userRef, {
                        inSprint: true
                    })
                })
                



                
        
                get(sprRef).then((snapshot) => {
                    const sprintDetails = snapshot.val();
                    if (sprintDetails) {

                        const currentMembers = sprintDetails.v7_sprintMembers || [];
                        //Change the user account in sprint status to FALSE for previous tasks that werent checked
                        // Identify old assignees who need to have their inSprint status set to false
                        const oldAssignees = currentMembers.filter(member => 
                            !sprintAssignees.some(newMember => newMember.userID === member.userID)
                        );

                        // Update inSprint status to false for old assignees
                        oldAssignees.forEach(member => {
                            const userRef = ref(database, 'user-accounts/' + member.userID);
                            update(userRef, {
                                inSprint: false
                            });
                        });








                        let temp = sprintDetails.v5_allocatedTasks || []; 
        
                        // Push task IDs
                        if (sprintTaskIDs) {
                            temp.push(...sprintTaskIDs);
                        }
        
                        // Save the updated tasks to the database
                        return update(sprRef, { v5_allocatedTasks: temp, v7_sprintMembers: sprintAssignees });
                    }
                }).then(() => {
                    alert("Successfully saved tasks into sprint");
                    
                    // If there are tasks to remove from the log
                    if (sprintTaskIDs) {
                        removeTasksFromLog(sprintTaskIDs, sprint.taskId);
                    }
                    closeViewSprint();

                    setTimeout(() => {
                        showAssigneesNewTask(); 
                    }, 1500);
        
        
                }).catch((error) => {
                    console.error('Error: ', error);
                    alert('Error: ' + error.message); 
                });
            };

            

            del_btn.onclick = function() {
                del_btn.disabled = true;
                removeSprintFromLog(sprint.taskId);
                closeViewSprint();
                setTimeout(() => {
                    showAssigneesNewTask(); 
                }, 1500);
                del_btn.disabled = false;
            };
        

            // Function to toggle the modal
            function toggleModal(taskID) {
                const modal = document.getElementById(`move-tasks-modal-${taskID}`);
                modal.style.display = modal.style.display === "block" ? "none" : "block";
            }
            
            console.log(document.getElementById(`three-dots-btn-${taskID}`))
            document.getElementById(`three-dots-btn-${taskID}`).addEventListener('click', function() {
                console.log(";")
                toggleModal(taskID);
           
            });

            document.getElementById(`close-three-dots-btn-${taskID}`).addEventListener('click', function() {
                console.log("ko")
                toggleModal(taskID);
            });



            //Save Edit Task Details:
            const saveButton = document.getElementById(`save-edit-btn-${taskID}`);
            console.log(saveButton)
            saveButton.addEventListener('click', function() {
                taskSaveSprint(sprint, taskID);
                setTimeout(() => {
                    showAssigneesNewTask(); 
                }, 1500);
            });
            



        });
    }
}


function moveTaskAnotherSprint(taskID, prev_task_sprint){


    const previous_sprint_ref = ref(database, 'sprint-log/' + prev_task_sprint.taskId);

    const target_task_sprintID = document.getElementById(`sprint-selector-${taskID}`).value;

    
    //Validation Check:
    if (!target_task_sprintID){
        alert("Please Select A Sprint to Move Task to!");
        return;
    }


    if (target_task_sprintID === 'product-backlog'){

        alert("lol")

        const pbl_task_Ref = ref(database, 'product-backlog/' +taskID);

        const prev_tasks = prev_task_sprint.v5_allocatedTasks;

        for(let i=0; i<prev_task_sprint.v5_allocatedTasks.length;i++){

            const temp_task = prev_tasks[i];

            if (temp_task === taskID){
                //Remove the task
                prev_tasks.splice(i, 1);
                //Update the previous sprint with the remvoed task:
                update(previous_sprint_ref, {
                    v5_allocatedTasks: prev_tasks
                }).then(() => {
                    console.log("Updated the previous sprint with removed task!");
                                
                    //Change Assigned To SprintStatus for task to "None"
                    update(pbl_task_Ref, {
                        assignedToSprint: "None"
                    }).then(() => {
                        console.log("Task was move back to product backlog");

                        //Update task hhistory:
                        move_task_history(taskID, target_task_sprintID);


                        //Close the edit screen:
                        const modal = document.getElementById(`move-tasks-modal-${taskID}`);
                        modal.style.display = "none";
                        //Then, close the view sprint details screen:
                        closeViewSprint();
                     

                        return;
                    }).catch(error => {
                        console.error("Error: ", error);
                    });

                }).catch(error => {
                    console.log("Error: ", error);
                })
            }
        }
    } 
    else {

        //If the option was NOT TO MOVE TO PRODUCT BACKLOG:
        //Database references:
        const target_sprint_ref = ref(database, 'sprint-log/' + target_task_sprintID);

        //Update the current sprint to remove "moving task" in allocated tasks:
        if (prev_task_sprint.hasOwnProperty('v5_allocatedTasks')){

            const prev_tasks = prev_task_sprint.v5_allocatedTasks;

            for (let i=0; i<prev_tasks.length; i++){

                const temp = prev_tasks[i];

                //If the iterating task is equal to the task id we are trying to move:
                if (temp === taskID){ 
                    console.log(prev_tasks)

                    //Remove from previous sprint
                    prev_tasks.splice(i, 1);
                    console.log(prev_tasks)

                    //Update the previous sprint with the remvoed task:
                    update(previous_sprint_ref, {

                        v5_allocatedTasks: prev_tasks
                    }).then(() => {
                        console.log("Updated the previous sprint with removed task!");


                        get(target_sprint_ref).then((snapshot) =>{

                            let target_tasks = [];

                            if (snapshot.val().hasOwnProperty('v5_allocatedTasks')){
                                target_tasks = snapshot.val().v5_allocatedTasks;
                            }


                            //Push the task to the ntarget sprint allocated task
                            target_tasks.push(taskID)

                            //Then, set the new allocated tasks to the database

                            update(target_sprint_ref, {

                                v5_allocatedTasks:target_tasks
                            }).then(() =>{
                                console.log("Task moved to new sprint successfully");
                                const modal = document.getElementById(`move-tasks-modal-${taskID}`);
                                modal.style.display = "none";
                                
                            }).catch(error => {
                                console.log("Error: ", error);
                                const modal = document.getElementById(`move-tasks-modal-${taskID}`);
                                modal.style.display = "none";
                            });
                        });

                    }).catch(error => {
                        console.error("Error: ", error);
                    });


                    break;

                }

                
            }
        }
    }
}





/* HISTORY LOG STUFF */
function move_task_history(Id, target){

    //After we save it into the product backlog database, we also want to keep track of the history log of the task
    //and keep track on when it was published
    const taskHistoryRef = ref(database, 'task-history-logs/' + Id);

    // Fetch the current history log
    get(taskHistoryRef).then((snapshot) => {

        //check if the snap shot exists
        if (snapshot.exists()) {

            const historyData = snapshot.val();

            // Get the current timestamp
            const curr_time = new Date().toLocaleString("en-AU", {
                timeZone: "Australia/Sydney",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });

            let changeDetails = `Task moved to ${target}`;
            if (target !== 'product-backlog'){
                changeDetails = `Task moved to another sprint`;
            }
            


            // Create the new history entry
            const newEntry = {
                event: "Task Location was altered",
                timestamp: curr_time,
                details: changeDetails
            };

     
            // Append the new entry to the history array
            if (Array.isArray(historyData.t3_history)) {
                historyData.t3_history.push(newEntry);
            } else {
                // In case the history log is not an array, initialise it as new entry array
                historyData.t3_history = [newEntry];
            }

            // Update the last modified timestamp
            historyData.t2_last_modified = curr_time;

            // Save the updated history back to the database
            set(taskHistoryRef, historyData).then(() => {

                console.log("Task history updated successfully!");

            }).catch((error) => {
                
                console.error("Error updating task history:", error);
            });

        } else {
            console.error("Task history not found for task ID:", Id);
        }
    }).catch((error) => {
        console.error("Error fetching task history:", error);
    });
}


function task_edit_history(Id){
       //After we save it into the product backlog database, we also want to keep track of the history log of the task
    //and keep track on when it was published
    const taskHistoryRef = ref(database, 'task-history-logs/' + Id);

    // Fetch the current history log
    get(taskHistoryRef).then((snapshot) => {

        //check if the snap shot exists
        if (snapshot.exists()) {

            const historyData = snapshot.val();

            // Get the current timestamp
            const curr_time = new Date().toLocaleString("en-AU", {
                timeZone: "Australia/Sydney",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });

            let changeDetails = `Task Modified in Sprint Board`;

            
            // Create the new history entry
            const newEntry = {
                event: "Updated and Saved Changes",
                timestamp: curr_time,
                details: changeDetails
            };

     
            // Append the new entry to the history array
            if (Array.isArray(historyData.t3_history)) {
                historyData.t3_history.push(newEntry);
            } else {
                // In case the history log is not an array, initialise it as new entry array
                historyData.t3_history = [newEntry];
            }

            // Update the last modified timestamp
            historyData.t2_last_modified = curr_time;

            // Save the updated history back to the database
            set(taskHistoryRef, historyData).then(() => {

                console.log("Task history updated successfully!");

            }).catch((error) => {
                
                console.error("Error updating task history:", error);
            });

        } else {
            console.error("Task history not found for task ID:", Id);
        }
    }).catch((error) => {
        console.error("Error fetching task history:", error);
    });
}



/* =====================================================================================*/












function addSprintToDatabase(){

    
    //Get the sprint title
    const sprintTitle = document.getElementById('sprint-title').value;

    //Get the sprint description
    const sprintDesc = document.getElementById('sprint-desc').value;

    //Get the sprint starting date
    const sprintStartDate = (document.getElementById('start-date').value);
    //Get the sprint ending date
    const sprintEndDate = (document.getElementById('end-date').value);

    //Get all team members for this sprint:
    const selectedAssignees = document.querySelectorAll('input[name="assignees"]:checked');

  
    let sprintAssignees = Array.from(selectedAssignees).map(assignee => JSON.parse(assignee.value));

    console.log(sprintAssignees)

    // Reset the checked checkboxes
    selectedAssignees.forEach(checkbox => {
        checkbox.checked = false; 
    });



    //Get all checked/selected tasks for this sprint (for now, we get the task ID)
    const checkedTasks = document.querySelectorAll('input[name="available-task"]:checked');

    
    //Convert the nodelist into an array and retrieve the values
    let sprintTaskIDs = Array.from(checkedTasks).map(task => task.value);

    
    if (sprintTaskIDs.length ==0){
        sprintTaskIDs = null;
    }
    if (sprintAssignees.length == 0) {
        sprintAssignees = null; 
    }


    if (validateSprintInput(sprintTitle,sprintDesc, sprintStartDate, sprintEndDate)){
        return;
    };

    //Get the sprint starting date
    const newStartDate = formatDateToDDMMYYYY(document.getElementById('start-date').value);
    //Get the sprint ending date
    const newEndDate = formatDateToDDMMYYYY(document.getElementById('end-date').value);



    //Create the sprint id:
    const Id = push(child(ref(database), 'sprint-log')).key;

    // Get the selected roles
    const productOwner = document.getElementById('product-owner-dropdown').value;
    const scrumMaster = document.getElementById('scrum-master-dropdown').value;
    const selectedDevelopers = Array.from(document.getElementById('developers-dropdown').selectedOptions).map(option => option.value);

    
    
    set(ref(database, 'sprint-log/' + Id), {

        v1_sprintTitle: sprintTitle,
        v2_sprintDesc: sprintDesc,
        v3_sprintStartDate: newStartDate,
        v4_sprintEndDate: newEndDate,
        v5_allocatedTasks: sprintTaskIDs,
        v6_SprintStatus:"Not Started", // Default is No started
        v7_sprintMembers: sprintAssignees,
        v7_userRoles: {
            productOwner: productOwner || "Not Assigned",
            scrumMaster: scrumMaster || "Not Assigned",
            developer: selectedDevelopers.length > 0 ? selectedDevelopers : null
        }

    }).then(() => {
        alert('Saved Sprint into the Database');

    
        if (sprintTaskIDs) {
            removeTasksFromLog(sprintTaskIDs,Id);
        }

        if (sprintAssignees){
            assigneeStatus(sprintAssignees, Id);

        }

        setTimeout(() => {
            showAssigneesNewTask(); // Call your function after the delay
        }, 1500);

    }).catch((error) => {
        console.error('Error saving data:', error);
    });
}
function assigneeStatus(sprintAssignees, Id) {

    sprintAssignees.forEach(member => {
        const userRef = ref(database, 'user-accounts/' + member.userID);

        
        get(userRef).then(snapshot => {
            if (snapshot.exists()) {
                const userDetails = snapshot.val();

                // Update the user's inSprint status to true
                update(userRef, {
                    inSprint: true
                }).catch(error => {
                    console.error('Error updating inSprint status for user:', member.userID, error);
                });
            } else {
                console.warn('User not found for userID:', member.userID);
            }
        }).catch(error => {
            console.error('Error retrieving user details for userID:', member.userID, error);
        });
    });
}


function removeTasksFromLog(sprintTaskIDs,sprintID){


    if (!sprintTaskIDs) {
        console.log("No tasks to remove.");
        return;
    }
    // Loop through each selected task ID
    sprintTaskIDs.forEach((taskId) => {
        // Reference to the specific task in the product backlog
        const taskRef = ref(database, 'product-backlog/' + taskId);
        
        // Use the update method to only modify the assignedToSprint property
        update(taskRef, {
            assignedToSprint: "True"
        }).then(() => {
            console.log(`Task updated successfully.`);
            move_task_history(taskId,'product-backlog')
        }).catch((error) => {
            console.error('Error updating task:', error);
        });
    });

}

function removeSprintFromLog(sprintID) {
    if (!sprintID) {
        console.log("No Sprints to remove.");
        return;
    }

    // Reference to the specific sprint in the sprint log
    const sprintRef = ref(database, 'sprint-log/' + sprintID);

    // Ensure tasks are moved back to the product backlog
    get(sprintRef).then((snapshot) => {
        if (snapshot.exists()) {
            const sprintData = snapshot.val();

            let taskIds = [];

            if (sprintData.hasOwnProperty('v5_allocatedTasks')) {
                taskIds = sprintData.v5_allocatedTasks;
            }

            // Create an array of promises for task updates
            const taskPromises = taskIds.map((taskId) => {
                const taskRef = ref(database, 'product-backlog/' + taskId);
                
                return update(taskRef, {
                    assignedToSprint: "None"
                }).then(() => {
                    console.log(`Task ${taskId} moved back to product backlog.`);
                }).catch((error) => {
                    console.error(`Error updating task ${taskId}:`, error);
                });
            });

            // Handle sprint members removal if they exist
            const teamMembers = sprintData.v7_sprintMembers || [];

            // Create an array of promises for member updates
            const memberPromises = teamMembers.map((member) => {
                console.log(member.userID)
                const memberRef = ref(database, 'user-accounts/' + member.userID);
                return update(memberRef, {
                    inSprint: false
                }).then(() => {

                    console.log(`Member ${member.userID} removed from sprint.`);
                }).catch((error) => {
                    console.error(`Error updating member ${member.userID}:`, error);
                });
            });

            // Use Promise.all to ensure all tasks and members are updated before removing the sprint
            Promise.all([...taskPromises, ...memberPromises])
                .then(() => {
                    // After all tasks and members are updated, remove the sprint
                    return remove(sprintRef);
                })
                .then(() => {
                    console.log(`Sprint ${sprintID} removed from sprint log.`);
                })
                .catch((error) => {
                    console.error('Error removing sprint or updating related data:', error);
                });

        } else {
            console.log('Sprint not found in the sprint log.');
        }
    }).catch((error) => {
        console.error('Error retrieving sprint data:', error);
    });
}






function fetchDisplaySprint() {
    
    const dbRef = ref(database, 'sprint-log/');
    
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        const dataArray = [];
        
        if (data) {
            for (const key in data) {
                data[key].taskId = key;  // Add the Firebase key to the task data
                dataArray.push(data[key]);
            }
        }
        
        console.log(dataArray)
        populateSprint(dataArray);


    }, (error) => {
        console.error('Error fetching data:', error);
    });
}







function populateSprint(sprints) {
    console.log(sprints);

    
    const futureSprintsColumn = document.querySelector("#sprint-future .future-sprints-section");
    const inProgressSprintsColumn = document.querySelector("#sprint-in-progress .in-progress-sprints-section");
    const completedSprintsColumn = document.querySelector("#sprint-completed .completed-sprints-section");

    
    futureSprintsColumn.innerHTML = `<h3 class="sprint-title">Not Started</h3>`;
    inProgressSprintsColumn.innerHTML = `<h3 class="sprint-title">In Progress</h3>`;
    completedSprintsColumn.innerHTML = `<h3 class="sprint-title">Completed</h3>`;

    // Loop through the sprint data and create HTML for each sprint
    sprints.forEach(sprint => {
     
        const sprint_status = sprint.v6_SprintStatus;

        // Create the new sprint card element
        const newSprintCard = document.createElement("article");
        newSprintCard.classList.add("sprint-card");

        // Get allocated tasks
        let all_tasks = sprint.v5_allocatedTasks;

        // Handle empty or null tasks
        if (!all_tasks || all_tasks.length === 0) {
            newSprintCard.innerHTML = `
                <h4 class="sprint-name">${sprint.v1_sprintTitle}</h4>
                <hr class="sprint-line-thing">
                <div class="sprint-card-details">
                    <p>Dates: ${sprint.v3_sprintStartDate} - ${sprint.v4_sprintEndDate}</p>
                    <p>Sprint Status: ${sprint.v6_SprintStatus}</p>
                    <p>No allocated tasks for this sprint.</p>
                    <p>Total Story Points: 0</p>
                </div>
            `;

            // Add click event for viewing sprint details
            newSprintCard.style.cursor = "pointer";
            newSprintCard.addEventListener("click", () => viewNoTaskSprint(sprint));

            // Append to appropriate section based on sprint status
            appendSprintCardToColumn(sprint_status, newSprintCard, futureSprintsColumn, inProgressSprintsColumn, completedSprintsColumn);



        } else {
            // Calculating total number of story points in this sprint
            let total_points = 0;

            // Create an array of promises for fetching task points
            const taskPromises = all_tasks.map(taskID => {
                const dbRef = ref(database, 'product-backlog/' + taskID);
                return new Promise((resolve) => {
                    onValue(dbRef, (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            total_points += parseInt(data.val5_points) || 0; // Ensure safe parsing
                        }
                        resolve();
                    });
                });
            });

            // Wait for all promises to resolve
            Promise.all(taskPromises).then(() => {
                newSprintCard.innerHTML = `
                    <h4 class="sprint-name">${sprint.v1_sprintTitle}</h4>
                    <hr class="sprint-line-thing">
                    <div class="sprint-details">
                        <p>Dates: ${sprint.v3_sprintStartDate} - ${sprint.v4_sprintEndDate}</p>
                        <p>Sprint Status: ${sprint.v6_SprintStatus}</p>
                        <p>Number of Tasks: ${sprint.v5_allocatedTasks.length}</p>
                        <p>Total Story Points: ${total_points}</p>
                    </div>
                `;


                // If sprint has NOT STARTED, WE ADD "SET ACTIVE BUTTON"
                if (sprint_status === "Not Started") {
                    const activateSprintBtn = document.createElement('button');
                    activateSprintBtn.textContent = 'Start Sprint';
                    activateSprintBtn.classList.add('edit-button');

                    activateSprintBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        setSprintActive(sprint);
                    });

                    newSprintCard.append(activateSprintBtn);
                    // Add click event for viewing sprint details
                    newSprintCard.style.cursor = "pointer";
                    newSprintCard.addEventListener("click", () => viewSprintDetails(sprint));  
                }
                else if (sprint_status === "In Progress") {
                    const current_user = getLoginDetails(); 
                
                    newSprintCard.style.cursor = "pointer"; 
                
                    newSprintCard.addEventListener("click", () => {
                        // Check if the current user is in the sprint
                        console.log(current_user)
                        checkUserInSprint(current_user, sprint).then(isInSprint => {
                            console.log("LOL")
                            console.log(isInSprint)
                            console.log(isInSprint.isMember)
                            if (isInSprint.isMember) {
                                const sprintDetails = JSON.stringify(sprint);
                                
                                // Store the sprint details in session storage
                                sessionStorage.setItem('selectedSprint', sprintDetails);
                
                                
                                window.location.href = `current_sprint_details_page.html`;

                            } else {
                                alert(isInSprint.message); 
                            }
                        }).catch(error => {
                            console.error('Error checking if user is in sprint:', error); 
                        });
                    });
                }
                 else if(sprint_status === "Completed"){

                    newSprintCard.style.cursor ="pointer";

                    newSprintCard.addEventListener('click', (e) =>{
                        
    
                        const sprintDetails = JSON.stringify(sprint);
            
                        sessionStorage.setItem('currPrevSprint', sprintDetails);
                        window.location.href= `previous_completed_sprint_page.html`


                    });

                }





                // Append to appropriate section based on sprint status
                appendSprintCardToColumn(sprint_status, newSprintCard, futureSprintsColumn, inProgressSprintsColumn, completedSprintsColumn);

            }).catch(error => {
                console.error("Error", error);
            });
        }
    });
}

function checkUserInSprint(currentUser, sprint) {


    const sprintRef = ref(database, `sprint-log/${sprint.taskId}/v7_sprintMembers`);
    
    return get(sprintRef).then(snapshot => {
        if (snapshot.exists()) {
            const members = snapshot.val();
            console.log("HELLO")
            console.log(currentUser)
            console.log(members)

            // Check if the current user is in the sprint members
            if (members.some(member => member.userID === currentUser.userID)) {
            
                return {
                    isMember: true,
                    message: `User ${currentUser.userID} is allowed to access the sprint.`
                };
            } else {
                // If the user is not in the sprint, make a list of member emails
                const memberUserIDs = members.map(member => member.email).join(', ');
                return {
                    isMember: false,
                    message: `User ${currentUser.userID} is NOT allowed to access the sprint. Members allowed: ${memberUserIDs}.`
                };
            }
        } else {
            console.warn('No sprint members found.');
            return {
                isMember: false,
                message: 'No members found for this sprint.'
            };
        }
    }).catch(error => {
        console.error('Error fetching sprint members:', error);
        return {
            isMember: false,
            message: 'Error fetching sprint members. Please try again later.'
        };
    });
}



//Adding the sprint card to the designated column
function appendSprintCardToColumn(sprint_status, sprintCard, futureSprintsColumn, inProgressSprintsColumn, completedSprintsColumn) {

    switch (sprint_status) {
        case "Not Started":
            futureSprintsColumn.appendChild(sprintCard);
            break;
        case "In Progress":
            inProgressSprintsColumn.appendChild(sprintCard);
            break;
        case "Completed":
            completedSprintsColumn.appendChild(sprintCard);
            break;
        default:
            console.log("Unknown Sprint Status:", sprint_status);
    }
}



function showAssigneesNewTask() {
    const assigneeList = document.getElementById('assignee-list');
    assigneeList.innerHTML = ''; // Clear previous options

    const userAccountRef = ref(database, 'user-accounts');

    // Dynamically create a <style> tag for custom checkbox styles
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-checkbox {
            width: 20px;
            height: 20px;
            background-color: white;
            border: 2px solid #2B2D42;
            border-radius: 5px;
            display: inline-block;
            position: relative;
            cursor: pointer;
        }

        div input[type="checkbox"]:checked + .custom-checkbox {
            background-color: black;
        }

        div input[type="checkbox"]:checked + .custom-checkbox::after {
            content: '';
            position: absolute;
            left: 4px;
            top: 0px;
            width: 8px;
            height: 14px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
    `;
    document.head.appendChild(style); // Append the <style> tag to the <head>

    get(userAccountRef).then(snapshot => {
        if (snapshot.exists()) {
            const userIDData = snapshot.val();


            //Get all user accounts:
            for (let userID in userIDData) {
                const currUser = userIDData[userID];

                if (currUser.inSprint !== true) {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.marginBottom = '8px';
                    item.style.position = 'relative'; // Needed for custom checkbox positioning

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = JSON.stringify(currUser);
                    checkbox.name = 'assignees';
                    checkbox.style.marginRight = '10px'; // Spacing between checkbox and label
                    checkbox.style.opacity = '0'; // Hide the default checkbox visually

                    // Create the label and the span for custom checkbox
                    const label = document.createElement('label');
                    label.textContent = currUser.email;
                    label.style.marginLeft = '10px'; // Spacing between custom checkbox and label
                    label.style.fontSize = '14px'; // Set font size to smaller
                    label.style.fontWeight = '400'; // Set font weight to lighter (normal)


                    const customCheckbox = document.createElement('span');
                    customCheckbox.classList.add('custom-checkbox');

                    // Append checkbox and label with custom styling
                    item.appendChild(checkbox);
                    item.appendChild(customCheckbox);
                    item.appendChild(label);
                    assigneeList.appendChild(item);

                    // Add click event to custom checkbox to toggle the actual checkbox
                    customCheckbox.addEventListener('click', () => {
                        checkbox.checked = !checkbox.checked;
                        customCheckbox.style.backgroundColor = checkbox.checked ? 'black' : 'white'; // Change background color based on checked state
                    });
                }
            }
        }
    });
}













function toggleAddSprintPopup() {
    const addSprintPopup = document.getElementById('add-sprint-modal');
    addSprintPopup.style.display = addSprintPopup.style.display === 'block' ? 'none' : 'block';
}

// Function to close the popup
function closePopup() {
    const addSprintPopup = document.getElementById('add-sprint-modal');
    if (addSprintPopup) {
        addSprintPopup.style.display = 'none'; // Hides the popup
    }
}

// Function to reset input fields
function resetInputFields() {
    document.getElementById('sprint-title').value = '';
    document.getElementById('sprint-desc').value = '';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    // Deselect all checkboxes (if applicable)
    const checkedTasks = document.querySelectorAll('input[name="available-task"]:checked');
    checkedTasks.forEach(task => {
        task.checked = false;
    });
}

function populateUserDropdowns() {
    const userAccountsRef = ref(database, 'user-accounts');

    onValue(userAccountsRef, (snapshot) => {
      const users = snapshot.val();

      document.getElementById('product-owner-dropdown').innerHTML = '<option value=""></option>';
      document.getElementById('scrum-master-dropdown').innerHTML = '<option value=""></option>';
      document.getElementById('developers-dropdown').innerHTML = '<option value=""></option>';

      for (const userId in users) {
        const user = users[userId];
        const optionElement = document.createElement('option');
        optionElement.value = userId;


        optionElement.text = user.email;

        document.getElementById('product-owner-dropdown').appendChild(optionElement.cloneNode(true));
        document.getElementById('scrum-master-dropdown').appendChild(optionElement.cloneNode(true));
        document.getElementById('developers-dropdown').appendChild(optionElement.cloneNode(true));
      }
    })
  }

document.getElementById('add-sprint-btn').addEventListener('click', function(e){
    //e.preventDefault();
    toggleAddSprintPopup();
    populateUserDropdowns();

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close-add-sprint-modal")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        toggleAddSprintPopup();
        closePopup(); // Use the closePopup function here
        resetInputFields(); // Reset fields when closing
    }
 
});

document.getElementById('submit-sprint-btn').addEventListener('click', function(e) {
    e.preventDefault();

    // Add the Sprints to the database
    addSprintToDatabase()

    closePopup();
    resetInputFields();

});









document.addEventListener("DOMContentLoaded", function(e) {
    //Then, populate the html 
    //e.preventDefault();
    fetchDisplaySprint();
    showAssigneesNewTask();
    showProductLogOptions();

});
