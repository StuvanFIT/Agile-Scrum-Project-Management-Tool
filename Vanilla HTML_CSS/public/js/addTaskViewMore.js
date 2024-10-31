
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";


//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, onValue} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";


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

export function viewMoreTaskSprint(row, taskID) {

    console.log(taskID)
    const viewMoreScreen = document.getElementById('view-more-screen');

    const taskDetails = document.getElementById('task-details');

    console.log(row);

    const historyRef = ref(database, 'task-history-logs/' + taskID);
    console.log(historyRef);

    onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        console.log(data);

        // Check if t3_history exists and is an array before trying to map it
        const historyLogs = data && data.t3_history ? data.t3_history : [];

        // Populate the task details
        taskDetails.innerHTML = `
            <div style="display: flex;">
                <div style="flex: 1;">
                    <p><strong>Title:</strong> ${row.val1_title}</p>
                    <p><strong>Task Detail Description:</strong> ${row.val2_desc}</p>
                    <p><strong>Tag:</strong> ${row.val3_tag}</p>
                    <p><strong>Priority:</strong> ${row.val4_priority}</p>
                    <p><strong>Story Points:</strong> ${row.val5_points}</p>
                    <p><strong>Current Task Stage:</strong> ${row.val6_stage}</p>
                    <p><strong>Current Task Status:</strong> ${row.val7_status}</p>
                    <p><strong>Accumulated Effort for Task:</strong> ${row.accumulatedEffort}</p>
                    <p><strong>Assignee:</strong> ${row.assignee}</p>
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
    });


    


    viewMoreScreen.style.display = 'block'; //show the view more screen
}

// Close the modal
export function closeViewMore() {
    
    const viewMoreScreen = document.getElementById('view-more-screen');

    viewMoreScreen.style.display = 'none'; // Hide the modal
}
