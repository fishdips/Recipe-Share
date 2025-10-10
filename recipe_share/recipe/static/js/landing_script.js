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

function getDifficultyBadge(cookTime) {
  if (!cookTime) return { label: 'Medium', class: 'difficulty-medium' };
  
  if (cookTime <= 30) return { label: 'Easy', class: 'difficulty-easy' };
  if (cookTime <= 60) return { label: 'Medium', class: 'difficulty-medium' };
  return { label: 'Hard', class: 'difficulty-hard' };
}

function truncateText(text, maxLength) {
  if (!text) return 'No description available';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function parseIngredients(ingredients) {
  if (!ingredients) return [];
  
  // Handle if ingredients is already an array
  if (Array.isArray(ingredients)) {
    return ingredients.slice(0, 3);
  }
  
  // Handle if it's a JSON string
  try {
    const parsed = JSON.parse(ingredients);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3);
    }
  } catch (e) {
    // If not JSON, try splitting by common delimiters
    const items = ingredients.split(/[,\n;]/).map(item => item.trim()).filter(item => item);
    return items.slice(0, 3);
  }
  
  return [];
}

function renderRecipes(recipes) {
  const grid = document.getElementById('recipesGrid');
  
  if (recipes.length === 0) {
    grid.innerHTML = '<div class="no-recipes">No recipes found</div>';
    return;
  }
  
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

  grid.innerHTML = recipes.map(recipe => {
    const difficulty = getDifficultyBadge(recipe.cook_time);
    const ingredients = parseIngredients(recipe.ingredients);
    
    return `
      <div class="recipe-card" onclick="viewRecipeDetail(${recipe.id})">
        <img src="${recipe.cover_photo_url || placeholderImage}" 
             alt="${recipe.title}" 
             class="recipe-image"
             onerror="this.src='${placeholderImage}'">
        
        <div class="recipe-content">
          <div class="recipe-header">
            <div class="recipe-meta">
              <span class="recipe-tag tag-${(recipe.cuisine || 'other').toLowerCase().replace(/\s+/g, '-')}">
                ${recipe.cuisine || 'Other'}
              </span>
              <span class="difficulty ${difficulty.class}">
                ${difficulty.label}
              </span>
            </div>
          </div>
          
          <h3 class="recipe-title">${recipe.title}</h3>
          
          <p class="recipe-description">
            ${truncateText(recipe.description, 100)}
          </p>
          
          <div class="recipe-stats">
            <div class="stat">
              <span>⏱️</span>
              <span>${recipe.cook_time || '30'} min</span>
            </div>
            <div class="stat">
              <span>🍽️</span>
              <span>${Math.floor(Math.random() * 4) + 2} servings</span>
            </div>
          </div>
          
          ${ingredients.length > 0 ? `
            <div class="ingredient-preview">
              <strong>Ingredients:</strong><br>
              ${ingredients.map(ing => `• ${ing}`).join('<br>')}
            </div>
          ` : ''}
          
          <div class="author-info">
            ${recipe.created_at ? 'Added ' + new Date(recipe.created_at).toLocaleDateString() : 'By RecipeShare Community'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateRecipeCount(count) {
  document.getElementById('recipeCount').textContent = `${count} recipe${count !== 1 ? 's' : ''}`;
}

function viewRecipeDetail(recipeId) {
  // Redirect to recipe detail page with recipe ID as query parameter
  window.location.href = `/recipe/${recipeId}/`;
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = displayedRecipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm) ||
    recipe.description?.toLowerCase().includes(searchTerm) ||
    JSON.stringify(recipe.ingredients || '').toLowerCase().includes(searchTerm)
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