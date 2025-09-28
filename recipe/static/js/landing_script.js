function showRecipeDetail(index) {
  const detail = document.getElementById("recipeDetail");
  detail.style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideRecipeDetail() {
  const detail = document.getElementById("recipeDetail");
  detail.style.display = "none";
}
