import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAg4NXpv6dHmmNqc-wAmJt4utArIpb9TbE",
  authDomain: "tunnelvision-f07f7.firebaseapp.com",
  databaseURL: "https://tunnelvision-f07f7-default-rtdb.firebaseio.com",
  projectId: "tunnelvision-f07f7",
  storageBucket: "tunnelvision-f07f7.appspot.com",
  messagingSenderId: "779720304073",
  appId: "1:779720304073:web:4e1e9e3cf3f1ecd337f418"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Listen to login form submission
document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Get user email and password input
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    
    // Firebase authentication sign-in

    setPersistence(auth, browserSessionPersistence)
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
    })
    .then((userCredential) => {
        // Signed in Succesfully
        console.log("Logged in successfully");
        console.log(userCredential)

        const user = userCredential.user;

        //Store it in local storage on top of the browser
        sessionStorage.setItem('userID', user.uid); 
        sessionStorage.setItem('userEmail', user.email); 

        window.location.href = "home.html";
    })
    .catch((error) => {
        // Show specific error messages
        let errorMessage;
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = "Invalid email format.";
                break;
            case 'auth/user-disabled':
                errorMessage = "User account is disabled.";
                break;
            case 'auth/user-not-found':
                errorMessage = "No user found with this email.";
                break;
            case 'auth/wrong-password':
                errorMessage = "Incorrect password. Please try again.";
                break;
            default:
                errorMessage = "Error: " + error.message;
                break;
        }
        document.getElementById('error-message').textContent = errorMessage;
    });
    
});
