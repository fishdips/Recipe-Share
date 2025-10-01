document.addEventListener("DOMContentLoaded", function () {
    const cancelBtn = document.querySelector(".cancel-btn");
    const proceedBtn = document.querySelector(".proceed-btn");

    cancelBtn.addEventListener("click", function () {
        window.location.href = "/"; 
    });

    proceedBtn.addEventListener("click", function () {
        window.location.href = "/logout/"; 
    });
});
