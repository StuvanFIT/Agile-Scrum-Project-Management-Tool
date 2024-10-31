
// Get modal element and buttons
const modal = document.getElementById("deleteMessage");

// Close the modal if user clicks outside of it
window.addEventListener("click", function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        console.log( modal.style.display)
    }
});
