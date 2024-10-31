import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-analytics.js";
import {getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

//import some of the commands we need from the firebase js library
//https://modularfirebase.web.app/reference/database <-- refer to this for the list of commands 

import { getDatabase, ref, set, push, child, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js";


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
const auth = getAuth(app);



function getLoginDetails() {
    const userID = sessionStorage.getItem('userID');
    const userEmail = sessionStorage.getItem('userEmail');
    return { userID, userEmail };
}

// Function to get user details based on userID
function getUserDetails(userID) {
    const userRef = ref(database, 'user-accounts/' + userID);

    return get(userRef).then(snapshot => {
        if (snapshot.exists()) {
            const userDetails = snapshot.val();
            return userDetails;
        } else {
            console.log("No user data found");
            return null;
        }
    }).catch(error => {
        console.error("Error fetching user data:", error);
        return null;
    });
}

// Profile picture and name handling
const currentUserLoggedIn = getLoginDetails();
const userID = currentUserLoggedIn.userID;
const userEmail = currentUserLoggedIn.userEmail;
let userDetails = null;

if (userID) {
    // Fetch the user details and update the DOM once they are retrieved
    getUserDetails(userID).then(user_details => {
        if (user_details) {
            userDetails = user_details;

            // Update the DOM with the user's profile name once the details are fetched
            document.querySelector('.profile-name').textContent = userDetails.name;
        }
    });
} else {
    console.log("User isn't logged in properly!");
}

// Profile pop-up logic
function profileDetail() {
    if (userDetails) {
        // Populate the pop-up with user details
        document.getElementById("profileName").textContent = `${userDetails.name}`;
        document.getElementById("profileEmail").textContent = `Email: ${userDetails.email}`;
        document.getElementById("profileSprintStatus").textContent = `Sprint Status: ${userDetails.inSprint ? "IN SPRINT":"NOT IN SPRINT"}` ;

        // Show the profile pop-up
        document.getElementById("profile-pop-up").style.display = "block";
    } else {
        console.log("User details not loaded yet.");
    }
}

// Close profile pop-up when the user clicks the close button (x)
document.querySelector(".close-profile").onclick = function() {
    document.getElementById("profile-pop-up").style.display = "none";
}

// Add event listener to profile section
document.querySelector(".profile-details").addEventListener("click", (e) => {
    profileDetail();
});

