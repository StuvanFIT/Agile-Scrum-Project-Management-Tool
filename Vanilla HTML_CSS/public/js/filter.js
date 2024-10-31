export function closeFilterForm() {
    
    const filterPopUp = document.getElementById('filter-function');
    const background = document.querySelector(".blur-main-content"); 

    filterPopUp.style.display = 'none';
    background.classList.remove("blurred"); 
    
}