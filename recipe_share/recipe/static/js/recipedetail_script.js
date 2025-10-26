// Initialize Supabase client
const SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c";

console.log("Script loaded successfully");
console.log("Supabase available:", typeof window.supabase);

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("Supabase client created:", supabase);

// Global state for recipe stats
let currentRecipeStats = {
  averageRating: 0,
  totalRatings: 0,
  favoriteCount: 0,
  userRating: 0,
  isFavorited: false
};

// is user guest or logged
function isUserLoggedIn() {
  return window.CURRENT_USER_ID && window.CURRENT_USER_ID.trim() !== '';
}

// Load stats from db
async function loadRecipeStats(recipeId) {
  try {
    // Calculate rating
    const { data: ratings, error: ratingsError } = await supabase
      .from('recipe_ratings')
      .select('rating')
      .eq('recipe_id', recipeId);
    
    if (ratingsError) throw ratingsError;
    
    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      currentRecipeStats.averageRating = sum / ratings.length;
      currentRecipeStats.totalRatings = ratings.length;
    }
    
    // Get favorite count
    const { count: favCount, error: favCountError } = await supabase
      .from('recipe_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);
    
    if (favCountError) throw favCountError;
    currentRecipeStats.favoriteCount = favCount || 0;
    
    // Check if current user has rated this recipe
    if (isUserLoggedIn()) {
      const { data: userRatingData, error: userRatingError } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID)
        .single();
      
      if (!userRatingError && userRatingData) {
        currentRecipeStats.userRating = userRatingData.rating;
      }
      
      // Check if user has favorited
      const { data: favData, error: favError } = await supabase
        .from('recipe_favorites')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID)
        .single();
      
      if (!favError && favData) {
        currentRecipeStats.isFavorited = true;
      }
    }
    
    updateStatsDisplay();
    
  } catch (error) {
    console.error('Error loading recipe stats:', error);
  }
}

// STATS
function updateStatsDisplay() {
  const dbRatingDisplay = document.querySelector('.db-rating-display');
  if (dbRatingDisplay) {
    dbRatingDisplay.innerHTML = generateDBRatingStars(currentRecipeStats.averageRating, currentRecipeStats.totalRatings);
  }
  
  const userStars = document.querySelectorAll('.user-rating-star');
  userStars.forEach((star, index) => {
    if (index < currentRecipeStats.userRating) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
  
  const userRatingContainer = document.querySelector('.user-rating-container');
  if (userRatingContainer) {
    if (currentRecipeStats.userRating > 0) {
      userRatingContainer.classList.add('has-rated');
    } else {
      userRatingContainer.classList.remove('has-rated');
    }
  }
  
  // Update favorite count and button state
  const favCount = document.querySelector('.favorite-count');
  if (favCount) {
    favCount.textContent = currentRecipeStats.favoriteCount;
  }
  
  const favBtn = document.querySelector('.favorite-btn');
  if (favBtn) {
    if (currentRecipeStats.isFavorited) {
      favBtn.classList.add('favorited');
      favBtn.querySelector('.btn-text').textContent = 'Favorited';
    } else {
      favBtn.classList.remove('favorited');
      favBtn.querySelector('.btn-text').textContent = 'Favorite';
    }
  }
}

function generateDBRatingStars(avgRating, totalRatings) {
  const fullStars = Math.floor(avgRating);
  const hasHalfStar = avgRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<span class="db-star filled">⭐</span>';
  }
  
  if (hasHalfStar) {
    starsHtml += '<span class="db-star half">⭐</span>';
  }
  
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<span class="db-star empty">☆</span>';
  }
  
  starsHtml += ` <span class="rating-score">${avgRating.toFixed(1)}/5</span>`;
  starsHtml += ` <span class="rating-count">(${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'})</span>`;
  
  return starsHtml;
}

function handleStarHover(starIndex) {
  const stars = document.querySelectorAll('.user-rating-star');
  stars.forEach((star, index) => {
    if (index <= starIndex - 1) {
      star.classList.add('hovered');
    } else {
      star.classList.remove('hovered');
    }
  });
}

function handleStarLeave() {
  const stars = document.querySelectorAll('.user-rating-star');
  stars.forEach(star => {
    star.classList.remove('hovered');
  });
}

// Rating
async function handleRating(recipeId, rating) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  try {
    // Check if user already rated
    const { data: existingRating, error: checkError } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', window.CURRENT_USER_ID)
      .single();
    
    if (existingRating) {
      // Update rating
      const { error: updateError } = await supabase
        .from('recipe_ratings')
        .update({ rating: rating })
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID);
      
      if (updateError) throw updateError;
      alert(`Rating updated to ${rating} star${rating > 1 ? 's' : ''}!`);
    } else {
      // New Rating
      const { error: insertError } = await supabase
        .from('recipe_ratings')
        .insert({
          recipe_id: recipeId,
          user_id: window.CURRENT_USER_ID,
          rating: rating
        });
      
      if (insertError) throw insertError;
      alert(`You rated this recipe ${rating} star${rating > 1 ? 's' : ''}!`);
    }
    
    await loadRecipeStats(recipeId);
    
  } catch (error) {
    console.error('Error submitting rating:', error);
    alert('Failed to submit rating. Please try again.');
  }
}

// Favortite
async function handleFavorite(recipeId) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  try {
    if (currentRecipeStats.isFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID);
      
      if (error) throw error;
      
      currentRecipeStats.isFavorited = false;
      currentRecipeStats.favoriteCount--;
      alert('Removed from favorites!');
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('recipe_favorites')
        .insert({
          recipe_id: recipeId,
          user_id: window.CURRENT_USER_ID
        });
      
      if (error) throw error;
      
      currentRecipeStats.isFavorited = true;
      currentRecipeStats.favoriteCount++;
      alert('Added to favorites!');
    }
    
    updateStatsDisplay();
    
  } catch (error) {
    console.error('Error toggling favorite:', error);
    alert('Failed to update favorite. Please try again.');
  }
}

// Comment
function handleComment(recipeId) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  const commentText = document.getElementById('commentInput').value.trim();
  
  if (!commentText) {
    alert('Please enter a comment');
    return;
  }
  
  console.log('Comment on recipe:', recipeId, 'by user:', window.CURRENT_USER_ID, 'text:', commentText);
  alert('Comment feature coming soon!');
  
  document.getElementById('commentInput').value = '';
}

// Share recipe function
function shareRecipe() {
  const url = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Check out this recipe!',
      url: url
    }).catch(err => console.log('Error sharing:', err));
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert('Recipe link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    });
  }
}

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
  
  const steps = instructionsData
    .split(/(?=\d+\.\s+)/)
    .filter(step => step.trim())
    .map(step => {
      let cleanStep = step.replace(/^\d+\.\s+/, '').trim();
      cleanStep = cleanStep.replace(/^Step\s+\d+:\s*/i, '').trim();
      return cleanStep.replace(/\n/g, '<br>');
    });
  
  console.log("Parsed instructions:", steps);
  return steps;
}

function getCuisineTagClass(cuisine) {
  if (!cuisine) return 'tag-other';
  const cuisineLower = cuisine.toLowerCase();
  if (cuisineLower.includes('italian')) return 'tag-italian';
  if (cuisineLower.includes('asian') || cuisineLower.includes('filipino')) return 'tag-asian';
  if (cuisineLower.includes('dessert')) return 'tag-dessert';
  if (cuisineLower.includes('mexican')) return 'tag-mexican';
  if (cuisineLower.includes('american')) return 'tag-american';
  if (cuisineLower.includes('french')) return 'tag-italian';
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
  
  const recipeId = recipe.id;
  const isLoggedIn = isUserLoggedIn();
  
  console.log("Recipe ID:", recipeId, "User logged in:", isLoggedIn);
  
  const html = `
    <style>
      .user-rating-star {
        cursor: pointer;
        font-size: 2.5rem;
        opacity: 0.3;
        transition: all 0.2s ease;
        display: inline-block;
        margin: 0 4px;
      }

      .user-rating-star.hovered,
      .user-rating-star.selected {
        opacity: 1;
      }

      .user-rating-star:hover {
        transform: scale(1.15);
      }

      .db-star {
        font-size: 1.8rem;
        margin: 0 2px;
      }

      .db-star.filled {
        opacity: 1;
      }

      .db-star.empty {
        opacity: 0.3;
      }

      .db-star.half {
        opacity: 0.7;
      }

      .favorite-btn {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .favorite-btn.favorited {
        background: linear-gradient(135deg, #fff9e6 0%, #fff3d6 100%);
        border-color: #ffeb3b;
        box-shadow: 0 2px 8px rgba(255, 235, 59, 0.3);
      }

      .favorite-btn.favorited .btn-icon {
        animation: heartBeat 0.6s ease;
        filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.5));
      }

      .favorite-btn:active .btn-icon {
        animation: pop 0.3s ease;
      }

      @keyframes heartBeat {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(1.3); }
        50% { transform: scale(1.1); }
        75% { transform: scale(1.25); }
      }

      @keyframes pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
      }

      .interaction-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .interaction-btn:active {
        transform: translateY(0);
      }

      .rating-stats-section {
        background: #f8f9fa;
        padding: 2rem;
        border-radius: 12px;
        margin: 2rem 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: start;
      }

      .user-rating-container {
        transition: all 0.3s ease;
        padding: 1rem;
        border-radius: 8px;
      }

      .user-rating-container.has-rated {
        background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
        border: 2px solid #81c784;
        box-shadow: 0 2px 8px rgba(129, 199, 132, 0.2);
      }

      .user-rating-container.has-rated .rating-title {
        color: #2e7d32;
      }

      .db-rating-container {
        padding: 1rem;
      }

      .rating-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
        color: #333;
        line-height: 1.2;
        min-height: 1.32rem;
      }

      .user-rating-stars {
        margin-top: 0.5rem;
      }



      .rating-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #333;
        line-height: 1.2;
        min-height: 1.32rem;
      }

      .rating-login-note {
        font-size: 0.85rem;
        color: #666;
        margin-top: 0.5rem;
        font-style: italic;
      }

      .rating-score {
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
        margin: 0 0.5rem;
      }

      .rating-count {
        font-size: 0.9rem;
        color: #666;
      }

      .favorite-count {
        background: #fff;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.9rem;
        margin-left: 4px;
      }

      @media (max-width: 768px) {
        .rating-stats-section {
          grid-template-columns: 1fr;
        }
      }
    </style>
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
    
    <div class="rating-stats-section">
      <div class="user-rating-container ${currentRecipeStats.userRating > 0 ? 'has-rated' : ''}">
        <h3 class="rating-title">Your Rating</h3>
        <div class="user-rating-stars" onmouseleave="handleStarLeave()">
          ${[1, 2, 3, 4, 5].map(star => `
            <span class="user-rating-star ${star <= currentRecipeStats.userRating ? 'selected' : ''}" 
                  onmouseenter="handleStarHover(${star})"
                  onclick="handleRating(${recipeId}, ${star})">
              ⭐
            </span>
          `).join('')}
        </div>
        ${!isLoggedIn ? '<p class="rating-login-note">Login to rate this recipe</p>' : ''}
      </div>
      
      <div class="db-rating-container">
        <h3 class="rating-title">Community Rating</h3>
        <div class="db-rating-display">
          ${generateDBRatingStars(0, 0)}
        </div>
      </div>
    </div>
    
    <div class="interaction-section">
      <div class="interaction-buttons">
        <button class="interaction-btn favorite-btn" onclick="handleFavorite(${recipeId})">
          <span class="btn-icon">⭐</span>
          <span class="btn-text">Favorite</span>
          <span class="favorite-count">0</span>
        </button>
        
        <button class="interaction-btn share-btn" onclick="shareRecipe()">
          <span class="btn-icon">🔗</span>
          <span class="btn-text">Share</span>
        </button>
      </div>
      
      ${isLoggedIn ? '' : '<p class="login-prompt">💡 <a href="/login/?next=' + window.location.pathname + '">Login</a> to rate, favorite, and comment!</p>'}
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
    
    <div class="comments-section">
      <h2 class="section-title">
        <span>💬</span>
        Comments
      </h2>
      
      ${isLoggedIn ? `
        <div class="comment-form">
          <textarea 
            id="commentInput" 
            class="comment-input" 
            placeholder="Share your thoughts about this recipe..."
            rows="3"
          ></textarea>
          <button class="submit-comment-btn" onclick="handleComment(${recipeId})">
            Post Comment
          </button>
        </div>
      ` : `
        <div class="comment-login-prompt">
          <p>🔒 Please <a href="/login/?next=${window.location.pathname}">login</a> to leave a comment</p>
        </div>
      `}
      
      <div class="comments-list">
        <p class="no-comments">No comments yet. Be the first to comment!</p>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  console.log("Recipe rendered successfully");
  
  loadRecipeStats(recipeId);
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
  console.log("Current User ID:", window.CURRENT_USER_ID);
  loadRecipe();
});