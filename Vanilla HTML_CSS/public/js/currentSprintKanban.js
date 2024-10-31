import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";



//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, set, push, child, onValue, update, get, remove} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

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

import {closeViewMore, viewMoreTaskSprint } from "./addTaskViewMore.js";
import { addTaskTimeLog, closeTimeLog } from './addTaskContributionLog.js';

function getLoginDetails() {
    const userID = sessionStorage.getItem('userID');
    const userEmail = sessionStorage.getItem('userEmail');
    return { userID, userEmail };
}




export function populateColumns(sprintDetails){

    //Add the sprint title
    const existingTitle = document.getElementById('page-title');
    if (existingTitle){
        existingTitle.textContent = `${sprintDetails.v1_sprintTitle}`;
    }

    //we need to add the sprint date to the title to let the client know the sprint date:
    //Add this under the sprint title
    const existingHeader = document.getElementById('sprintDateHeading');
    if (existingHeader) {
        existingHeader.innerHTML = ''; // Clear the contents of the existing header
    }

    const sprintDateHeading = document.createElement('h3');
    sprintDateHeading.id = "sprintDateHeading";

    
    //sprintDateHeading.text-align = "center";
    sprintDateHeading.textContent = `${sprintDetails.v3_sprintStartDate} - ${sprintDetails.v4_sprintEndDate}`;

    sprintDateHeading.style.color = "#f5e6e8";
    sprintDateHeading.style.textAlign = "center"; 
    sprintDateHeading.style.marginTop = "20px"; 
    sprintDateHeading.style.fontWeight = "800"; 
    sprintDateHeading.style.fontSize = "24px"; 
    sprintDateHeading.style.fontFamily = "Inter, sans-serif"; 
    

    var page_title = document.querySelector('.page-title');
    page_title.insertAdjacentElement('afterend', sprintDateHeading);

    




    //Retrieve the columns form HTML page:
    const notStartedCol = document.getElementById("task-ns-container");
    const inProgressCol = document.getElementById("task-ip-container");
    const completedCol = document.getElementById("task-c-container");

    //Clear any already existing tasks to ensure we get the updated tasks:
    notStartedCol.innerHTML = '';
    inProgressCol.innerHTML = '';
    completedCol.innerHTML = '';

    //The current tasks in the sprint
    const sprintTasks = sprintDetails.v5_allocatedTasks;


    //CURRENT USER LOGGED RIGHT NOW:
    let currentUser = getLoginDetails();
    console.log(currentUser)


    //For each task in the sprint, we assign it to the correct column based on its status
    sprintTasks.forEach(taskID => {

        

        //Fetch the the task details with the task id from product log database:
        const taskRef = ref(database, 'product-backlog/' + taskID);

        get(taskRef).then(snapshot => {
            if (snapshot.exists()) {
                var taskDetails = snapshot.val();

                // Create a card version of the task:
                const taskCard = createSprintCard(taskDetails, taskID,currentUser);

                // Update the card's status dynamically based on its new status
                switch (taskDetails.val7_status) {
                    case "Not Started":
                        notStartedCol.appendChild(taskCard);
                        break;
                    case "In Progress":
                        inProgressCol.appendChild(taskCard);
                        break;
                    case "Completed":
                        completedCol.appendChild(taskCard);
                        break;
                    default:
                        console.warn("Unknown status:", taskDetails.val7_status);
                        break;
                }
            } else {
                console.log("No task data found");
            }
        }).catch(error => {
            console.error("Error fetching task data:", error);
        });
 
    });
   
    // Call the setupColumnDrop function on each column to enable dragging and dropping
    setupColumnDrop(document.querySelector('.task-list1'));
    setupColumnDrop(document.querySelector('.task-list2'));
    setupColumnDrop(document.querySelector('.task-list3'));

}

function createSprintCard(taskDetails,taskID, currentUser){

    /* 
    <article class="task-item-index">
        <h2 class="task-title">Edit Index Page HTML</h2>
        <hr class="task-line-thing">
        <p class="task-tag">Tag: Front End</p>
        <p class="task-description">Description: Blah blah blah.</p>
        <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/c50bf69a126cbd4fc7748e0f77758be1fb956b4317d9297644144fa700b0de9c?placeholderIfAbsent=true&apiKey=f532244c172d4d249b9f67d33f595cf7" alt="" class="expand-button">
    </article>
    */
    
    const userID = currentUser.userID;
    const userEmail = currentUser.userEmail;

    console.log(currentUser);


    const card = document.createElement('article');
    card.classList.add('task-item-index');
    card.id = `task-item-${taskID}`;
    card.style.position = 'relative';
    //Make the card draggable:
    card.draggable = true;
    card.style.cursor = "pointer";


    //Add drag start event listener
    card.addEventListener('dragstart', (e) =>{

        //Lets store the things we need for the drag data:
        const drag_data = {
            taskID: taskID,
            taskDetails: taskDetails
        }
        e.dataTransfer.setData('text/plain', JSON.stringify(drag_data)); // Store task ID in drag data
        e.target.classList.add('dragging'); 
    });

    //Add drag end event listener
    card.addEventListener('dragend', (e) => {
        console.log('pop')
        e.target.classList.remove('dragging'); 
    });

    //Make the task card clickable:
    card.addEventListener('click', (e) =>{
        console.log("l")
        viewMoreTaskSprint(taskDetails,taskID);

    });


    //Create Time Log for that task:
    const timeLogButton = document.createElement('img');
    timeLogButton.src = 'Images/timelog_icon.png';
    timeLogButton.style.width = '50px';
    timeLogButton.style.height = '50px';
    timeLogButton.style.position = 'absolute';
    timeLogButton.style.bottom = '10px';  
    timeLogButton.style.right = '10px';
    var canEdit = false;
    
    console.log(userID)
    console.log(userEmail)
    console.log(taskDetails.assignee)

    if (taskDetails.assignee === userEmail){
 
        canEdit = true;
        //If the time log button is clicked on, the person assigned to the task is able to time log their accumulative effort.
        timeLogButton.addEventListener('click', function(event){
            event.stopPropagation();

            const dbRef = ref(database, 'product-backlog/');
                
            get(dbRef).then(snapshot => {
                const data = snapshot.val();
                const dataArray = [];
                if (data) {
                    for (const key in data) {
                        if (key === taskID){
                            data[key].taskId = key;  
                            dataArray.push(data[key]);
                            break;
                        }       
                    }
                    addTaskTimeLog(dataArray[0], taskID);

                    


                    setTimeout(() => {
                        const submit_btn =  document.getElementById('add-time');
                        submit_btn.disabled = false;
                    }, 1000); // Add a delay before re-enabling the button 
                    
                }

            }, (error) => {
                console.error('Error fetching data:', error);
            }); 
        });

    }

    card.innerHTML = `
        <h2 class="task-title">${taskDetails.val1_title}</h2>
        <hr class="task-line-thing">
        <p class="task-tag">Tag: ${taskDetails.val3_tag}</p>
        <p class="task-description">Description: ${taskDetails.val2_desc}</p>
        <p>Assignee: ${taskDetails.assignee}</p> 
        `;

    if (canEdit === true){
        card.appendChild(timeLogButton);

    }
    return card;
}

function setupColumnDrop(column) {
    //Retrieve the columns form HTML page:
    const notStartedCol = document.querySelector('.task-list1');
    const inProgressCol = document.querySelector('.task-list2');
    const completedCol = document.querySelector('.task-list3');





    column.addEventListener('dragover', (e) => {
        //Prevent the default allows us to move the draggable object over the droppable zone
        //So, we make the column a droppable zone
        e.preventDefault(); 
    });

    column.addEventListener('drop', (e) => {
        e.preventDefault(); // Prevent default
        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));

        console.log(dragData)
        console.log(dragData.taskID)

        const taskRef = ref(database, 'product-backlog/' + dragData.taskID); // Get a reference to the task

        // Update the task status based on the column
        let newStatus = null;

        if (column === notStartedCol) {
            newStatus = "Not Started";
        } else if (column === inProgressCol) {
            newStatus = "In Progress";
        } else if (column === completedCol) {
            newStatus = "Completed";
        }

        
        update(taskRef, { val7_status: newStatus })

        .then(() => {
            
            console.log("Task status updated:", newStatus);

            // Remove the task card from the original column
            const taskCard = document.getElementById(`task-item-${dragData.taskID}`);
            if (taskCard) {
                taskCard.remove(); 
            }

            // Create a new task card with the updated status
            const newTaskCard = createSprintCard({ ...dragData.taskDetails, val7_status: newStatus }, dragData.taskID, getLoginDetails());
            column.appendChild(newTaskCard);

            


        })
        .catch((error) => {
            console.error("Error updating task status:", error);
        });

        //location.reload();// this is a scuffed solution get the latest changes

        
    });
}

function updateSessionStorage(newTitle=null, newDesc=null){
    const curr_sessionItem = JSON.parse(sessionStorage.getItem('selectedSprint'));

    if (curr_sessionItem){

        if (newTitle !==null){
            curr_sessionItem.v1_sprintTitle = newTitle;
        }
        if (newDesc !==null){
            curr_sessionItem.v2_sprintDesc = newDesc;
        }
     
    
        const new_sessionItem = JSON.stringify(curr_sessionItem);
        sessionStorage.setItem('selectedSprint', new_sessionItem);
        console.log("Item successfully updated in session storage!")
    } else{
        console.log("Item does not exist in the session storage!");
    }
}

function editSprint(){
    const sprintDetails = JSON.parse(sessionStorage.getItem('selectedSprint'));
    console.log(sprintDetails)

    //Display current input fields
    document.getElementById('sprint-title').value = sprintDetails.v1_sprintTitle;
    document.getElementById('sprint-desc').value = sprintDetails.v2_sprintDesc;


    document.getElementById("update-edit-sprint").addEventListener("click", (e) =>{

        //Get the new title:
        const newTitle = document.getElementById("sprint-title").value;
        //Get the new sprint description:
        const newDesc = document.getElementById("sprint-desc").value;

        const sprintRef = ref(database, 'sprint-log/' +sprintDetails.taskId);

        update(sprintRef, {

            v1_sprintTitle: newTitle,
            v2_sprintDesc: newDesc
        }).then(() =>{

            console.log("Updated the sprint details!")
            updateSessionStorage(newTitle,newDesc);

            //update the sprint title
            const new_sprintDetails = JSON.parse(sessionStorage.getItem('selectedSprint'));
            const existingTitle = document.getElementById('page-title');
            if (existingTitle){
                existingTitle.textContent = `${new_sprintDetails.v1_sprintTitle}`;
            }
            

        })

    })
}




export function completeSprint() {

    
    const sprintDetails = JSON.parse(sessionStorage.getItem('selectedSprint'));
    console.log(sprintDetails)
    // Reference to the sprint in 'sprint-log'
    const sprintRef = ref(database, 'sprint-log/' + sprintDetails.taskId);

    // Retrieve and update the sprint status to Completed
    get(sprintRef).then(snapshot => {
        if (snapshot.exists()) {
            const sprintVal = snapshot.val();
            console.log(sprintVal);

            // Update the sprint status
            update(sprintRef, {
                v6_SprintStatus: "Completed"
            });

            // Store sprint and task details in "completed-sprints"
            setCompletedSprintDatabase(sprintVal, sprintDetails.taskId);

            // Process the tasks in the sprint
            const tasksToProcess = sprintDetails.v5_allocatedTasks; 

            tasksToProcess.forEach(taskID => {
                const taskRef = ref(database, 'product-backlog/' + taskID);

                // Retrieve each task
                get(taskRef).then(taskSnapshot => {
                    if (taskSnapshot.exists()) {
                        const taskVal = taskSnapshot.val();
                        const status = taskVal.val7_status;

                        // If task is "Not Started" or "In Progress," move it back to product backlog
                        if (status === "Not Started" || status === "In Progress") {
                            update(taskRef, {
                                assignedToSprint: "None"
                            }).then(() => {
                                // Log task history for incomplete tasks
                                taskHistorySprintCompletion(sprintDetails, taskID);

                            });
                        } 
                        //Then, we need to change the status of each member to false, so they can enter another sprint:
                        completeSprintMemberStatus(sprintVal, sprintDetails.taskId)
                    } else {
                        console.error(`Task with ID ${taskID} not found.`);
                    }
                });
            });

            // Once all tasks are processed, store the sprint's final state in completed sprints
            Promise.all(tasksToProcess).then(() => {

                storeCurrentTask(tasksToProcess, sprintDetails);

                console.log("All tasks processed. Final sprint state stored.");
            
                
                // Go back to sprints page after a 2-second delay
                setTimeout(() => {
                    window.location.href = `sprint_page.html`;
                }, 2000);
                
            });
        }
    });
}


function completeSprintMemberStatus(sprintVal, sprintID){

    const sprintRef = ref(database,'sprint-log/' + sprintID);


    get(sprintRef).then(snapshot =>{

        if (snapshot.exists()){

            const sprintDetails = snapshot.val();

            const sprintMembers = sprintDetails.v7_sprintMembers;

            sprintMembers.forEach(member =>{

                const memberUserID = member.userID

                const userAccountRef = ref(database, 'user-accounts/' + memberUserID);
                console.log(memberUserID)
                update(userAccountRef, {
                    inSprint: false
                }).catch(error =>{

                    console.log("Error: ", error)
                })
            })
        }
    })


}



function taskHistorySprintCompletion(sprintDetails,taskID){

    //Get the task's history log:
    const histRef = ref(database, 'task-history-logs/'+taskID)

    get(histRef).then(snapshot =>{

        if(snapshot.exists()){
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

            
            // Create the new history entry
            const newEntry = {
                event: "Incompleted Task moved to product backlog!",
                timestamp: curr_time,
                details: `Sprint: ${sprintDetails.v1_sprintTitle} has been Completed!\n
                Incompleted Task moved back to product backlog!`
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
            set(histRef, historyData).then(() => {

                console.log("Task history updated successfully!");

            }).catch((error) => {
                
                console.error("Error updating task history:", error);
            });
        }
    }).catch((error) => {
        console.error("Error fetching task history:", error);
    });
}


function setCompletedSprintDatabase(sprintVal, sprintID){

    const completeSprintRef = ref(database, "completed-sprints/"+sprintID);

    const entry ={

        v1_sprintTitle:sprintVal.v1_sprintTitle,
        v2_sprintDesc:sprintVal.v2_sprintDesc,
        v3_sprintStartDate:sprintVal.v3_sprintStartDate,
        v4_sprintEndDate:sprintVal.v4_sprintEndDate,
        v6_SprintStatus:"Completed"
    }

    set(completeSprintRef, entry).then(() =>{
        console.log("Pushed completed sprint to the database")
    }).catch((error) => {
        console.error("Error pushing the completed sprint: ", error);
    });
}


function storeCurrentTask(tasksToProcess, sprintDetails) {

    console.log(tasksToProcess);

    let taskPromises = [];  

    tasksToProcess.forEach(taskID => {
        const reffy = ref(database, "product-backlog/" + taskID);
        const histyRef = ref(database, "task-history-logs/" + taskID);

        // Push the combined promise of task data and history data to taskPromises array
        taskPromises.push(
            get(reffy).then(snapshot => {
                if (snapshot.exists()) {
                    let taskDetails = snapshot.val();
                    taskDetails.id = taskID;  // Attach the task ID

                    // Now chain the history retrieval
                    return get(histyRef).then(historySnapshot => {
                        if (historySnapshot.exists()) {
                            let historyDetails = historySnapshot.val();
                            historyDetails.id = taskID;  

                            // Add history details to the taskDetails object
                            taskDetails.history = historyDetails;
                        }

                        return taskDetails;  
                    });
                }
                return null;  
            })
        );
    });

   
    Promise.all(taskPromises).then(taskArray => {
      
        // Proceed to update the completed sprint's task list
        const completeSprintRef = ref(database, "completed-sprints/" + sprintDetails.taskId);

        get(completeSprintRef).then((snapshot) => {
            if (snapshot.exists()) {
                // Update with the array of task details
                update(completeSprintRef, {
                    v5_allocatedTasks: taskArray
                }).then(() => {
                    console.log("UPDATED ALLOCATED TASKS IN COMPLETED SPRINT");
                }).catch(error => {
                    console.log("Error: ", error);
                });
            }
        });
    }).catch(error => {
        console.log("Error fetching tasks:", error);
    });
}



//Close view more screen for task card
document.getElementById('close-view-more').addEventListener('click', closeViewMore);

//close add time log modal
document.getElementById('close-timelog-form').addEventListener('click', closeTimeLog);

//Complete sprint procedure
document.getElementById('complete-sprint-btn').addEventListener('click', completeSprint);

//Edit sprint title, sprint goal, 
document.getElementById('edit-sprint-btn').addEventListener('click', (e) =>{
    const editTaskPopUp = document.getElementById("edit-sprint-modal");
    const background = document.querySelector(".blur-kanban-container"); 

    editTaskPopUp.style.display = 'block';
    background.classList.add("blurred");
    editSprint();
});

//Close Edit sprint form:
document.getElementById("close-edit-sprint-modal").addEventListener('click', (e) =>{

    const editTaskPopUp = document.getElementById("edit-sprint-modal");
    const background = document.querySelector(".blur-kanban-container");  

    editTaskPopUp.style.display = 'none';
    background.classList.remove("blurred");

}); 

//Close Edit sprint form after updating:
document.getElementById("update-edit-sprint").addEventListener('click', (e) =>{

    const editTaskPopUp = document.getElementById("edit-sprint-modal");
    const background = document.querySelector(".blur-kanban-container");  

    editTaskPopUp.style.display = 'none';
    background.classList.remove("blurred");

});