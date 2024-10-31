// Close the modal


export function closeEditTaskForm() {
    
    const editTaskPopUp = document.getElementById('edit-task-form');
    const background = document.querySelector(".blur-main-content"); 

    editTaskPopUp.style.display = 'none';
    background.classList.remove("blurred"); 
    
}
