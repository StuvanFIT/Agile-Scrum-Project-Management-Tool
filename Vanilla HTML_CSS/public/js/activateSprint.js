
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";


//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, onValue, update} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";

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



export function setSprintActive(sprint){

    console.log(sprint)

    if (!sprint.hasOwnProperty("v5_allocatedTasks")){
        alert("The Sprint does not have any tasks!")
        return;
    }

    const inProgressSprintsColumn = document.querySelector("#sprint-in-progress .in-progress-sprints-section");

    const sprintRef = ref(database, 'sprint-log/' + sprint.taskId);
                
    // Update sprint status to be in progress:
    update(sprintRef, {
        v6_SprintStatus: "In Progress" 
    }).then(() => {
        console.log(`Current Sprint is now in progress!`);
    }).catch((error) => {
        console.error(`Error: `, error);
    });

}


