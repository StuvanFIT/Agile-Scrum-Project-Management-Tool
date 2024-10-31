export function closePBTaskForm() {
    
    const editTaskPopUp = document.getElementById('add-product-requirement-backlog');
    const background = document.querySelector(".blur-main-content"); 

    editTaskPopUp.style.display = 'none';
    background.classList.remove("blurred"); 
    
}