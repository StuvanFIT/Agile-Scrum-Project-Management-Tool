
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";


//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, set,get } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";




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

export function addTaskTimeLog(rowData, index) {
    //NOTE: WHEN WE ASSIGN EVENT LISTENERS IN A FUNCTION, WE END UP ASSIGINING MULTIPLE LISTENERS TO THE SAME BUTTON, THUS DUPLICATE VALUES WERE SHOWN IN THE TABLE
    //SO WE NEED TO REMOVE THEM AND CREATE A NEW BUTTON

    document.getElementById('add-time-log').style.display = 'block';

    console.log(rowData)

    //Only the assigned team member can edit the task
    document.getElementById('team-member').value = rowData.assignee;


    // Remove any previous event listeners:
    //So we create a new button and then attach the event listeners 
    //Copy: cloneNode
    const submit_time_log_btn = document.getElementById('add-time').cloneNode(true);
    document.getElementById('add-time').replaceWith(submit_time_log_btn);
    
    const submit_btn =  document.getElementById('add-time');

    // Attach the new event listener for submitting time log
    submit_btn.addEventListener('click', function(e) {
        e.preventDefault();

        submit_btn.disabled = true;


        update_task_effort(rowData, index);

        setTimeout(() => {
            submit_btn.disabled = false;
        }, 1000); // Add a delay before re-enabling the button 
    });
}








function update_task_effort(rowData, index){

    console.log(rowData)

    const memberName = document.getElementById('team-member').value;
    const numberHours = parseFloat(document.getElementById('hours-spent').value);
    const currAccumulated = parseFloat(rowData.accumulatedEffort);

    const dateContribution = document.getElementById('date-contributed').value;
    const descContribution = document.getElementById('time-log-desc').value;

    // Check if fields are not empty
    if (!memberName || !descContribution || !dateContribution || isNaN(numberHours)) {
        alert("Need to input all fields");
        return;
    }

    // Calculate the final hours spent
    const finalHours = currAccumulated + numberHours;


    // Call function to update task effort
    update_task_effort_aux(rowData.taskId, currAccumulated, finalHours, memberName, dateContribution, descContribution)
        .then(() => {
            // Reset form fields and hide modal after
            document.getElementById('team-member').value = '';
            document.getElementById('hours-spent').value = '';
            document.getElementById('date-contributed').value ='';
            document.getElementById('time-log-desc').value ='';
            document.getElementById('add-time-log').style.display = 'none';
            alert("Task updated successfully!");
            location.reload();
        })
        .catch((error) => {
            console.error("Error updating task:", error);
            alert("There was an error updating the task.");
        });
}



function update_task_effort_aux(Id, prevHours, finalHours, memberName, dateContribution, descContribution) {
    const productRef = ref(database, 'product-backlog/' + Id);
    const taskHistoryRef = ref(database, 'task-history-logs/' + Id);

    console.log(Id)
    console.log(taskHistoryRef)

    return get(productRef).then((snapshot) => {
        if (snapshot.exists()) {
            const taskDetails = snapshot.val();
            taskDetails.accumulatedEffort = finalHours;

            // Update task with new accumulated effort
            return set(productRef, taskDetails);

        } else {
            throw new Error("Task not found.");
        }
    }).then(() => {
        // Fetch and update the history log
        return get(taskHistoryRef).then((snapshot) => {
            if (snapshot.exists()) {
                const historyData = snapshot.val();
                const curr_time = new Date().toISOString();
                const newEntry = {
                    event: "Added to Time (Effort) Spent on Task ",
                    timestamp: curr_time,
                    details: `Accumulated Effort: ${prevHours} ---> ${finalHours} (${memberName})
                Date of contribution: ${dateContribution}
                Contribution Description: ${descContribution}`
                };


                if (Array.isArray(historyData.t3_history)) {
                    historyData.t3_history.push(newEntry);
                } else {
                    historyData.t3_history = [newEntry];
                }

                historyData.t2_last_modified = curr_time;

                // Update task history log
                return set(taskHistoryRef, historyData);
            } else {
                throw new Error("Task history not found.");
            }
        });
    });
}


// Close the modal
export function closeTimeLog() {
    
    const timeLogPopUp = document.getElementById('add-time-log');

    timeLogPopUp.style.display = 'none'; // Hide the modal
}
