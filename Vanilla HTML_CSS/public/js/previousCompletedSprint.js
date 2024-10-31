
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


export function populatePrevTasks(prevSprint){

    //Add the sprint title
    const existingTitle = document.getElementById('page-title');
    if (existingTitle){
        existingTitle.textContent = `${prevSprint.v1_sprintTitle}`;
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
    sprintDateHeading.textContent = `${prevSprint.v3_sprintStartDate} - ${prevSprint.v4_sprintEndDate}`;

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
    console.log(prevSprint.taskId)
    const refPrevSprint = ref(database, 'completed-sprints/'+prevSprint.taskId);

    let sprintTasks = [];
    get(refPrevSprint).then(snapshot =>{


        if(snapshot.exists()){

            const sprint_details = snapshot.val();
            
       
            for(let i=0; i<sprint_details.v5_allocatedTasks.length; i++){
                sprintTasks.push(sprint_details.v5_allocatedTasks[i])
            }

            //For each task in the sprint, we assign it to the correct column based on its status
            sprintTasks.forEach(task => {
                console.log(task)
                var taskCard = createSprintCard(task,task.id,prevSprint.taskId);

                // Update the card's status dynamically based on its new status
                switch (task.val7_status) {
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
                };

            });

        }
    })
   



}

function createSprintCard(taskDetails,taskID,sprintID){

    /* 
    <article class="task-item-index">
        <h2 class="task-title">Edit Index Page HTML</h2>
        <hr class="task-line-thing">
        <p class="task-tag">Tag: Front End</p>
        <p class="task-description">Description: Blah blah blah.</p>
        <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/c50bf69a126cbd4fc7748e0f77758be1fb956b4317d9297644144fa700b0de9c?placeholderIfAbsent=true&apiKey=f532244c172d4d249b9f67d33f595cf7" alt="" class="expand-button">
    </article>
    */
   


    const card = document.createElement('article');
    card.classList.add('task-item-index');
    card.id = `task-item-${taskID}`;
    card.style.position = 'relative';
    card.style.cursor = "pointer";


    //Make the task card clickable:
    card.addEventListener('click', (e) =>{
        console.log("l")
        viewTaskHistory(taskDetails,taskID,sprintID);

    });



    card.innerHTML = `
        <h2 class="task-title" style="color: black";>${taskDetails.val1_title}</h2>
        <hr class="task-line-thing">
        <p class="task-tag">Tag: ${taskDetails.val3_tag}</p>
        <p class="task-description">Description: ${taskDetails.val2_desc}</p>
        <p>Assignee: ${taskDetails.assignee}</p>
    `;
    
    return card;
}


function viewTaskHistory(taskInfo, taskID,sprintID){
    console.log(taskID)
    const viewMoreScreen = document.getElementById('view-more-screen');

    const taskDetails = document.getElementById('task-details');



    const sprintRef = ref(database, 'completed-sprints/' + sprintID);
    const allocatedTasksRef = child(sprintRef, 'v5_allocatedTasks');




    onValue(allocatedTasksRef, (snapshot) => {
        const tasks = snapshot.val();
        console.log(tasks);


        tasks.forEach(task =>{
                        // Check if t3_history exists and is an array before trying to map it
            const historyLogs = task && task.history.t3_history ? task.history.t3_history : [];

            console.log(task)
            console.log(historyLogs)

            // Populate the task details
            taskDetails.innerHTML = `
                <div style="display: flex;">
                    <div style="flex: 1;">
                        <p><strong>Title:</strong> ${task.val1_title}</p>
                        <p><strong>Task Detail Description:</strong> ${task.val2_desc}</p>
                        <p><strong>Tag:</strong> ${task.val3_tag}</p>
                        <p><strong>Priority:</strong> ${task.val4_priority}</p>
                        <p><strong>Story Points:</strong> ${task.val5_points}</p>
                        <p><strong>Current Task Stage:</strong> ${task.val6_stage}</p>
                        <p><strong>Current Task Status:</strong> ${task.val7_status}</p>
                        <p><strong>Accumulated Effort for Task:</strong> ${task.accumulatedEffort}</p>
                    </div>
                    <div style="
                        flex: 0 0 500px; 
                        max-height: 500px; 
                        overflow-y: auto; 
                        padding-left: 20px; 
                        margin-left: 20px; 
                        background-color: white;
                        width: 100px;
                    ">
                        <strong style="font-size: 20px;">Task History Log</strong>
                        <div style="
                            font-size: 14px; 
                            line-height: 1.6; 
                            margin-top: 10px;
                        ">
                            ${historyLogs.length > 0 ? historyLogs.map(log => `
                                <p><strong>${log.details}:</strong> ${log.event}</p>
                                <p><strong>DATE:</strong> ${log.timestamp}</p>
                                <hr style="border: 1px solid black;"> <!-- Add a horizontal line to separate each entry -->
                            `).join('') : '<p>No history logs available for this task.</p>'}
                        </div>
                    </div>
                </div>
            `;
        })
    });


    viewMoreScreen.style.display = 'block'; //show the view more screen

}



//Close view more screen for task card
document.getElementById('close-view-more').addEventListener('click', closeViewMore);