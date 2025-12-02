// ===== SUPABASE INITIALIZATION =====
const SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== GLOBAL STATE =====
let currentRecipeStats = {
  averageRating: 0,
  totalRatings: 0,
  favoriteCount: 0,
  userRating: 0,
  isFavorited: false
};

// ===== HELPER FUNCTIONS =====
function isUserLoggedIn() {
  return window.CURRENT_USER_ID && window.CURRENT_USER_ID.trim() !== '';
}

function getRecipeIdFromUrl() {
  const pathname = window.location.pathname;
  const match = pathname.match(/\/recipe\/(\d+)/);
  return match ? match[1] : null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCuisineTagClass(cuisine) {
  if (!cuisine) return 'tag-other';
  const cuisineLower = cuisine.toLowerCase();
  if (cuisineLower.includes('italian') || cuisineLower.includes('french')) return 'tag-italian';
  if (cuisineLower.includes('asian') || cuisineLower.includes('filipino')) return 'tag-asian';
  if (cuisineLower.includes('dessert')) return 'tag-dessert';
  if (cuisineLower.includes('mexican')) return 'tag-mexican';
  if (cuisineLower.includes('american')) return 'tag-american';
  return 'tag-other';
}

function calculateDifficulty(cookTime) {
  const time = parseInt(cookTime);
  if (time <= 15) return { level: 'Easy', class: 'difficulty-easy' };
  if (time <= 30) return { level: 'Medium', class: 'difficulty-medium' };
  return { level: 'Hard', class: 'difficulty-hard' };
}

// ===== FORMATTING FUNCTIONS =====
function formatIngredients(ingredientsData) {
  try {
    const ingredients = typeof ingredientsData === 'string' 
      ? JSON.parse(ingredientsData) 
      : ingredientsData;
    
    if (Array.isArray(ingredients)) {
      return ingredients.map(ing => {
        if (typeof ing === 'string') return ing;
        if (ing.item && ing.amount) return `${ing.amount} ${ing.item}`;
        return String(ing);
      });
    }
    return [];
  } catch (e) {
    console.error('Error parsing ingredients:', e);
    return [];
  }
}

function formatInstructions(instructionsData) {
  if (!instructionsData) return [];
  
  return instructionsData
    .split(/(?=\d+\.\s+)/)
    .filter(step => step.trim())
    .map(step => {
      let cleanStep = step.replace(/^\d+\.\s+/, '').trim();
      cleanStep = cleanStep.replace(/^Step\s+\d+:\s*/i, '').trim();
      return cleanStep.replace(/\n/g, '<br>');
    });
}

// ===== RATING DISPLAY =====
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

function updateStatsDisplay() {
  // Update DB rating display
  const dbRatingDisplay = document.querySelector('.db-rating-display');
  if (dbRatingDisplay) {
    dbRatingDisplay.innerHTML = generateDBRatingStars(currentRecipeStats.averageRating, currentRecipeStats.totalRatings);
  }
  
  // Update user rating stars
  const userStars = document.querySelectorAll('.user-rating-star');
  userStars.forEach((star, index) => {
    star.classList.toggle('selected', index < currentRecipeStats.userRating);
  });
  
  // Update user rating container
  const userRatingContainer = document.querySelector('.user-rating-container');
  if (userRatingContainer) {
    userRatingContainer.classList.toggle('has-rated', currentRecipeStats.userRating > 0);
  }
  
  // Update favorite count and button
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

// ===== STAR HOVER EFFECTS =====
function handleStarHover(starIndex) {
  const stars = document.querySelectorAll('.user-rating-star');
  stars.forEach((star, index) => {
    star.classList.toggle('hovered', index <= starIndex - 1);
  });
}

function handleStarLeave() {
  document.querySelectorAll('.user-rating-star').forEach(star => {
    star.classList.remove('hovered');
  });
}

// ===== DATABASE OPERATIONS =====
async function loadRecipeStats(recipeId) {
  try {
    // Get ratings
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
    
    // Check user's rating and favorite status if logged in
    if (isUserLoggedIn()) {
      const { data: userRatingData } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID)
        .single();
      
      if (userRatingData) {
        currentRecipeStats.userRating = userRatingData.rating;
      }
      
      const { data: favData } = await supabase
        .from('recipe_favorites')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID)
        .single();
      
      if (favData) {
        currentRecipeStats.isFavorited = true;
      }
    }
    
    updateStatsDisplay();
    
  } catch (error) {
    console.error('Error loading recipe stats:', error);
  }
}

async function handleRating(recipeId, rating) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  try {
    const { data: existingRating } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', window.CURRENT_USER_ID)
      .single();
    
    if (existingRating) {
      const { error } = await supabase
        .from('recipe_ratings')
        .update({ rating: rating })
        .eq('recipe_id', recipeId)
        .eq('user_id', window.CURRENT_USER_ID);
      
      if (error) throw error;
      alert(`Rating updated to ${rating} star${rating > 1 ? 's' : ''}!`);
    } else {
      const { error } = await supabase
        .from('recipe_ratings')
        .insert({
          recipe_id: recipeId,
          user_id: window.CURRENT_USER_ID,
          rating: rating
        });
      
      if (error) throw error;
      alert(`You rated this recipe ${rating} star${rating > 1 ? 's' : ''}!`);
    }
    
    await loadRecipeStats(recipeId);
    
  } catch (error) {
    console.error('Error submitting rating:', error);
    alert('Failed to submit rating. Please try again.');
  }
}

async function handleFavorite(recipeId) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  try {
    if (currentRecipeStats.isFavorited) {
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

// ===== COMMENTS =====
async function handleComment(recipeId, parentCommentId = null) {
  if (!isUserLoggedIn()) {
    window.location.href = `/login/?next=${window.location.pathname}`;
    return;
  }
  
  const inputId = parentCommentId ? `replyInput-${parentCommentId}` : 'commentInput';
  const commentInput = document.getElementById(inputId);
  const commentText = commentInput.value.trim();
  
  if (!commentText) {
    alert('Please enter a comment');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('recipe_comments')
      .insert({
        recipe_id: recipeId,
        user_id: window.CURRENT_USER_ID,
        comment: commentText,
        parent_comment_id: parentCommentId
      });
    
    if (error) throw error;
    
    // Update comments count
    await supabase.rpc('increment_comments_count', { recipe_id: recipeId });
    
    commentInput.value = '';
    
    // Hide reply form if it was a reply
    if (parentCommentId) {
      const replyForm = document.getElementById(`replyForm-${parentCommentId}`);
      if (replyForm) replyForm.style.display = 'none';
    }
    
    await loadComments(recipeId);
    alert(parentCommentId ? 'Reply posted successfully!' : 'Comment posted successfully!');
    
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Failed to post comment. Please try again.');
  }
}

async function loadComments(recipeId) {
  try {
    const { data: comments, error } = await supabase
      .from('recipe_comments')
      .select(`
        id,
        comment,
        created_at,
        user_id,
        parent_comment_id,
        users (full_name, email)
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    displayComments(comments || []);
    
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

function displayComments(comments) {
  const commentsList = document.querySelector('.comments-list');
  
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    return;
  }
  
  // Build comment hierarchy
  const commentMap = new Map();
  const rootComments = [];
  
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });
  
  comments.forEach(comment => {
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(commentMap.get(comment.id));
      }
    } else {
      rootComments.push(commentMap.get(comment.id));
    }
  });
  
  commentsList.innerHTML = rootComments.map(comment => renderCommentThread(comment)).join('');
}

function renderCommentThread(comment, depth = 0) {
  const userName = comment.users?.full_name || comment.users?.email || 'Anonymous';
  const commentDate = new Date(comment.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const isOwnComment = window.CURRENT_USER_ID && comment.user_id === parseInt(window.CURRENT_USER_ID);
  const isLoggedIn = isUserLoggedIn();
  const recipeId = getRecipeIdFromUrl();
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  return `
    <div class="comment-thread" style="margin-left: ${depth * 40}px;" data-comment-id="${comment.id}">
      <div class="single-comment ${isOwnComment ? 'own-comment' : ''}">
        ${hasReplies ? `
          <button class="collapse-btn" onclick="toggleThread(${comment.id})" title="Collapse thread">
            <span class="collapse-icon">▼</span>
          </button>
        ` : ''}
        
        <div class="comment-content-wrapper">
          <div class="comment-user-info">
            <span class="comment-avatar">👤</span>
            <div class="comment-meta">
              <span class="comment-username">
                ${userName}
                ${isOwnComment ? '<span class="you-badge">You</span>' : ''}
              </span>
              <span class="comment-timestamp">${commentDate}</span>
            </div>
          </div>
          
          <p class="comment-content">${escapeHtml(comment.comment)}</p>
          
          <div class="comment-actions">
            ${isLoggedIn ? `
              <button class="action-btn reply-btn" onclick="showReplyForm(${comment.id})">
                💬 Reply
              </button>
            ` : ''}
            
            ${isOwnComment ? `
              <button class="action-btn delete-btn" onclick="deleteComment(${comment.id})">
                🗑️ Delete
              </button>
            ` : ''}
            
            ${hasReplies ? `
              <span class="reply-count">${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}</span>
            ` : ''}
          </div>
          
          <div id="replyForm-${comment.id}" class="reply-form" style="display: none;">
            <textarea 
              id="replyInput-${comment.id}" 
              class="reply-input" 
              placeholder="Write your reply..."
              rows="2"
            ></textarea>
            <div class="reply-form-actions">
              <button class="submit-reply-btn" onclick="handleComment(${recipeId}, ${comment.id})">
                Post Reply
              </button>
              <button class="cancel-reply-btn" onclick="hideReplyForm(${comment.id})">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="replies-container" id="replies-${comment.id}">
        ${hasReplies ? comment.replies.map(reply => renderCommentThread(reply, depth + 1)).join('') : ''}
      </div>
    </div>
  `;
}

function toggleThread(commentId) {
  const thread = document.querySelector(`[data-comment-id="${commentId}"]`);
  const repliesContainer = document.getElementById(`replies-${commentId}`);
  const collapseIcon = thread.querySelector('.collapse-icon');
  
  if (repliesContainer.style.display === 'none') {
    repliesContainer.style.display = 'block';
    collapseIcon.textContent = '▼';
  } else {
    repliesContainer.style.display = 'none';
    collapseIcon.textContent = '▶';
  }
}

function showReplyForm(commentId) {
  // Hide all other reply forms
  document.querySelectorAll('.reply-form').forEach(form => {
    form.style.display = 'none';
  });
  
  const replyForm = document.getElementById(`replyForm-${commentId}`);
  if (replyForm) {
    replyForm.style.display = 'block';
    const input = document.getElementById(`replyInput-${commentId}`);
    if (input) input.focus();
  }
}

function hideReplyForm(commentId) {
  const replyForm = document.getElementById(`replyForm-${commentId}`);
  if (replyForm) {
    replyForm.style.display = 'none';
    const input = document.getElementById(`replyInput-${commentId}`);
    if (input) input.value = '';
  }
}

async function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  
  try {
    const recipeId = getRecipeIdFromUrl();
    
    const { error } = await supabase
      .from('recipe_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', window.CURRENT_USER_ID);
    
    if (error) throw error;
    
    await supabase.rpc('decrement_comments_count', { recipe_id: parseInt(recipeId) });
    await loadComments(recipeId);
    alert('Comment deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Failed to delete comment. Please try again.');
  }
}

// ===== SHARE FUNCTION =====
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

// ===== RENDER RECIPE =====
function renderRecipe(recipe) {
  const container = document.getElementById('recipeDetailContainer');
  
  const ingredients = formatIngredients(recipe.ingredients);
  const instructions = formatInstructions(recipe.instructions);
  const difficulty = calculateDifficulty(recipe.cook_time);
  const cuisineClass = getCuisineTagClass(recipe.cuisine);
  
  const defaultImage = 'https://via.placeholder.com/600x400?text=No+Image';
  const imageUrl = recipe.cover_photo_url || defaultImage;
  
  const recipeId = recipe.id;
  const isLoggedIn = isUserLoggedIn();
  
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
  
  // Load stats and comments
  setTimeout(() => {
    loadRecipeStats(recipeId);
    loadComments(recipeId);
  }, 0);
}

// Recipe loader
async function loadRecipe() {
  const recipeId = getRecipeIdFromUrl();
  
  if (!recipeId) {
    document.getElementById('recipeDetailContainer').innerHTML = 
      '<div class="error">Recipe ID not found in URL</div>';
    return;
  }
  
  try {
    const { data, error } = await supabase // process of this is to fetch the recuipe data from supabase nato
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      document.getElementById('recipeDetailContainer').innerHTML = 
        '<div class="error">Recipe not found</div>';
      return;
    }
    
    renderRecipe(data);
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    document.getElementById('recipeDetailContainer').innerHTML = 
      `<div class="error">Error loading recipe: ${error.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadRecipe);