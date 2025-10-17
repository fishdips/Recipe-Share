// Initialize Supabase client
const SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c";

console.log("Script loaded successfully");
console.log("Supabase available:", typeof window.supabase);

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("Supabase client created:", supabase);

function getRecipeIdFromUrl() {
  const pathname = window.location.pathname;
  console.log("Current pathname:", pathname);

  const match = pathname.match(/\/recipe\/(\d+)/);
  
  if (match && match[1]) {
    const recipeId = match[1];
    console.log("Recipe ID found:", recipeId);
    return recipeId;
  }
  
  console.error("Could not extract recipe ID from URL");
  return null;
}

// Format ingredients
function formatIngredients(ingredientsData) {
  console.log("Raw ingredients data:", ingredientsData);
  
  try {
    const ingredients = typeof ingredientsData === 'string' 
      ? JSON.parse(ingredientsData) 
      : ingredientsData;
    
    console.log("Parsed ingredients:", ingredients);
    
    if (Array.isArray(ingredients)) {
      return ingredients.map(ing => {
        if (typeof ing === 'string') {
          return ing;
        } else if (ing.item && ing.amount) {
          return `${ing.amount} ${ing.item}`;
        }
        return String(ing);
      });
    }
    return [];
  } catch (e) {
    console.error('Error parsing ingredients:', e);
    return [];
  }
}

// Format instructions
function formatInstructions(instructionsData) {
  console.log("Raw instructions data:", instructionsData);
  
  if (!instructionsData) return [];
  
  // Split by numbered steps (handles "1. ", "2. ", etc.)
  const steps = instructionsData
    .split(/(?=\d+\.\s+)/)
    .filter(step => step.trim())
    .map(step => {
      // Remove the number prefix (e.g., "1. ", "2. ", etc.)
      let cleanStep = step.replace(/^\d+\.\s+/, '').trim();
      
      // Also remove "Step X:" patterns (case insensitive)
      cleanStep = cleanStep.replace(/^Step\s+\d+:\s*/i, '').trim();
      
      // Convert \n to <br> for HTML display
      return cleanStep.replace(/\n/g, '<br>');
    });
  
  console.log("Parsed instructions:", steps);
  return steps;
}

// Get cuisine tag class
function getCuisineTagClass(cuisine) {
  if (!cuisine) return 'tag-other';
  const cuisineLower = cuisine.toLowerCase();
  if (cuisineLower.includes('italian')) return 'tag-italian';
  if (cuisineLower.includes('asian') || cuisineLower.includes('filipino')) return 'tag-asian';
  if (cuisineLower.includes('dessert')) return 'tag-dessert';
  if (cuisineLower.includes('mexican')) return 'tag-mexican';
  if (cuisineLower.includes('american')) return 'tag-american';
  if (cuisineLower.includes('french')) return 'tag-italian'; // Using same style as Italian
  return 'tag-other';
}

function calculateDifficulty(cookTime) {
  const time = parseInt(cookTime);
  if (time <= 15) return { level: 'Easy', class: 'difficulty-easy' };
  if (time <= 30) return { level: 'Medium', class: 'difficulty-medium' };
  return { level: 'Hard', class: 'difficulty-hard' };
}

function renderRecipe(recipe) {
  console.log("Rendering recipe:", recipe);
  
  const container = document.getElementById('recipeDetailContainer');
  
  const ingredients = formatIngredients(recipe.ingredients);
  const instructions = formatInstructions(recipe.instructions);
  const difficulty = calculateDifficulty(recipe.cook_time);
  const cuisineClass = getCuisineTagClass(recipe.cuisine);
  
  const defaultImage = 'https://via.placeholder.com/600x400?text=No+Image';
  const imageUrl = recipe.cover_photo_url || defaultImage;
  
  const html = `
    <div class="recipe-header">
      <div class="recipe-image-section">
        <img src="${imageUrl}" alt="${recipe.title}" class="recipe-main-image" onerror="this.src='${defaultImage}'">
      </div>
      
      <div class="recipe-info-section">
        <div class="recipe-meta">
          ${recipe.cuisine ? `<span class="recipe-tag ${cuisineClass}">${recipe.cuisine}</span>` : ''}
          ${recipe.category ? `<span class="recipe-tag tag-other">${recipe.category}</span>` : ''}
        </div>
        
        <h1 class="recipe-title">${recipe.title}</h1>
        
        <p class="recipe-description">${recipe.description || 'No description available'}</p>
        
        <div class="recipe-details-grid">
          <h3 class="recipe-details-title">Recipe Details</h3>
          <div class="detail-items">
            <div class="detail-item">
              <span class="detail-icon">⏱️</span>
              <div class="detail-content">
                <span class="detail-label">Cook Time</span>
                <span class="detail-value">${recipe.cook_time} mins</span>
              </div>
            </div>
            
            <div class="detail-item">
              <span class="detail-icon">📊</span>
              <div class="detail-content">
                <span class="detail-label">Difficulty</span>
                <span class="difficulty ${difficulty.class}">${difficulty.level}</span>
              </div>
            </div>
            
            <div class="detail-item">
              <span class="detail-icon">🥘</span>
              <div class="detail-content">
                <span class="detail-label">Ingredients</span>
                <span class="detail-value">${ingredients.length} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="recipe-content">
      <div class="ingredients-section">
        <h2 class="section-title">
          <span>🛒</span>
          Ingredients
        </h2>
        <ul class="ingredients-list">
          ${ingredients.length > 0 
            ? ingredients.map(ing => `
              <li class="ingredient-item">
                <span class="ingredient-bullet"></span>
                ${ing}
              </li>
            `).join('')
            : '<li class="ingredient-item">No ingredients listed</li>'
          }
        </ul>
      </div>
      
      <div class="instructions-section">
        <h2 class="section-title">
          <span>👨‍🍳</span>
          Instructions
        </h2>
        <ol class="instructions-list">
          ${instructions.length > 0
            ? instructions.map(step => `
              <li class="instruction-item">${step}</li>
            `).join('')
            : '<li class="instruction-item">No instructions provided</li>'
          }
        </ol>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  console.log("Recipe rendered successfully");
}

// Fetch and display recipe
async function loadRecipe() {
  console.log("=== Loading Recipe ===");
  
  const recipeId = getRecipeIdFromUrl();
  
  if (!recipeId) {
    console.error("No recipe ID found");
    document.getElementById('recipeDetailContainer').innerHTML = 
      '<div class="error">Recipe ID not found in URL</div>';
    return;
  }
  
  console.log("Fetching recipe with ID:", recipeId);
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();
    
    console.log("Supabase response:", { data, error });
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No recipe data returned");
      document.getElementById('recipeDetailContainer').innerHTML = 
        '<div class="error">Recipe not found</div>';
      return;
    }
    
    console.log("Recipe data received:", data);
    renderRecipe(data);
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    document.getElementById('recipeDetailContainer').innerHTML = 
      `<div class="error">Error loading recipe: ${error.message}</div>`;
  }
}

// Load recipe when page loads
console.log("Setting up DOMContentLoaded listener");
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Content Loaded - Starting recipe load");
  loadRecipe();
});