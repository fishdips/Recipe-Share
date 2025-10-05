const SUPABASE_URL = 'https://jfzojphxhgpejvffefvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allRecipes = [];
let displayedRecipes = [];

async function fetchRecipes() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*');

    if (error) throw error;

    allRecipes = data || [];
    
    displayedRecipes = getRandomRecipes(allRecipes, 9);
    
    renderRecipes(displayedRecipes);
    updateRecipeCount(displayedRecipes.length);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    document.getElementById('recipesGrid').innerHTML = 
      '<div class="error">Failed to load recipes. Please try again later.</div>';
  }
}

function getRandomRecipes(recipes, count) {
  const shuffled = [...recipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, recipes.length));
}

function renderRecipes(recipes) {
  const grid = document.getElementById('recipesGrid');
  
  if (recipes.length === 0) {
    grid.innerHTML = '<div class="no-recipes">No recipes found</div>';
    return;
  }

  grid.innerHTML = recipes.map(recipe => `
    <div class="recipe-card" onclick="viewRecipeDetail(${recipe.id})">
      <img src="${recipe.cover_photo_url || '/static/media/placeholder.jpg'}" 
           alt="${recipe.title}" 
           class="recipe-image"
           onerror="this.src='/static/media/placeholder.jpg'">
      <div class="recipe-content">
        <div class="recipe-meta">
          <span class="recipe-tag tag-${recipe.cuisine?.toLowerCase() || 'other'}">${recipe.cuisine || 'Other'}</span>
        </div>
        <h3 class="recipe-title">${recipe.title}</h3>
        <p class="recipe-description">${recipe.description || 'No description available'}</p>
      </div>
    </div>
  `).join('');
}

function updateRecipeCount(count) {
  document.getElementById('recipeCount').textContent = `${count} recipe${count !== 1 ? 's' : ''}`;
}

function viewRecipeDetail(recipeId) {
  alert('Please login to view full recipe details');
  window.location.href = '/login/';
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = displayedRecipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm) ||
    recipe.description?.toLowerCase().includes(searchTerm) ||
    recipe.ingredients?.toLowerCase().includes(searchTerm)
  );
  renderRecipes(filtered);
  updateRecipeCount(filtered.length);
});

document.getElementById('filterSelect').addEventListener('change', (e) => {
  const filterValue = e.target.value;
  
  if (filterValue === 'all') {
    renderRecipes(displayedRecipes);
    updateRecipeCount(displayedRecipes.length);
  } else {
    const filtered = displayedRecipes.filter(recipe => 
      recipe.cuisine?.toLowerCase() === filterValue.toLowerCase()
    );
    renderRecipes(filtered);
    updateRecipeCount(filtered.length);
  }
});

document.addEventListener('DOMContentLoaded', fetchRecipes);