// !! need to hide this key later --------------------------------
const SUPABASE_URL = 'https://jfzojphxhgpejvffefvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c';
// ----------------------------------------------------------------------
let supabaseClient;
let allRecipes = [];
let displayedRecipes = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
        document.getElementById('recipesGrid').innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">😕</div>
                <h3>Failed to load</h3>
                <p>Supabase library is missing. Please refresh the page.</p>
            </div>
        `;
        return;
    }
    
    await loadRecipes();
    setupSearchAndFilter();
});

function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    populateFilterOptions();
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterRecipes(searchTerm, currentFilter);
    });
    
    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        const searchTerm = searchInput.value.toLowerCase();
        filterRecipes(searchTerm, currentFilter);
    });
}

function populateFilterOptions() {
    const filterSelect = document.getElementById('filterSelect');
    
    const cuisines = [...new Set(
        allRecipes
            .map(r => r.cuisine)
            .filter(c => c && c.trim() !== '')
    )].sort();
    
    filterSelect.innerHTML = '<option value="all">All Cuisines</option>';
    
    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.value = cuisine;
        option.textContent = cuisine;
        filterSelect.appendChild(option);
    });
}

function filterRecipes(searchTerm, filter) {
    let filtered = allRecipes;
    
    if (filter !== 'all') {
        filtered = filtered.filter(recipe => 
            recipe.cuisine && recipe.cuisine.toLowerCase() === filter.toLowerCase()
        );
    }
    
    if (searchTerm) {
        filtered = filtered.filter(recipe => {
            const title = recipe.title ? recipe.title.toLowerCase() : '';
            const description = recipe.description ? recipe.description.toLowerCase() : '';
            const ingredients = recipe.ingredients ? JSON.stringify(recipe.ingredients).toLowerCase() : '';
            
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   ingredients.includes(searchTerm);
        });
    }
    
    displayedRecipes = filtered;
    renderRecipes(displayedRecipes);
}

async function loadRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    
    try {
        console.log('Fetching recipes from Supabase...');
        
        const { data: recipes, error } = await supabaseClient
            .from('recipes')
            .select(`
                *,
                users!recipes_author_id_fkey (
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        console.log('Recipes data:', recipes);
        console.log('Error:', error);

        if (error) {
            console.error('Error fetching recipes:', error);
            recipesGrid.innerHTML = `
                <div class="no-recipes">
                    <div class="no-recipes-icon">😕</div>
                    <h3>Failed to load recipes</h3>
                    <p>${error.message || 'Please try refreshing the page'}</p>
                </div>
            `;
            return;
        }

        allRecipes = recipes || [];
        displayedRecipes = allRecipes;
        
        renderRecipes(displayedRecipes);

    } catch (err) {
        console.error('Error loading recipes:', err);
        recipesGrid.innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">😕</div>
                <h3>Something went wrong</h3>
                <p>${err.message || 'Please try again later'}</p>
            </div>
        `;
    }
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
    
    if (Array.isArray(ingredients)) {
        return ingredients.slice(0, 3);
    }
    
    try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) {
            return parsed.slice(0, 3);
        }
    } catch (e) {
        const items = ingredients.split(/[,\n;]/).map(item => item.trim()).filter(item => item);
        return items.slice(0, 3);
    }
    
    return [];
}

function renderRecipes(recipes) {
    const grid = document.getElementById('recipesGrid');
    const recipeCount = document.getElementById('recipeCount');
    const recipesTitle = document.querySelector('.recipes-title');
    
    recipeCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`;
    
    if (currentFilter === 'all') {
        recipesTitle.textContent = 'All Recipes';
    } else {
        recipesTitle.textContent = `${currentFilter} Recipes`;
    }
    
    if (recipes.length === 0) {
        grid.innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">🍳</div>
                <h3>No recipes found</h3>
                <p>Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }
    
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

    grid.innerHTML = recipes.map(recipe => {
        const difficulty = getDifficultyBadge(recipe.cook_time);
        const ingredients = parseIngredients(recipe.ingredients);
        const recipeFullName = recipe.users?.full_name;
        const isMyRecipe = window.CURRENT_USERNAME && recipeFullName === window.CURRENT_USERNAME;
        
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
                        ${isMyRecipe ? 'Your Recipe' : recipeFullName ? `By ${recipeFullName}` : 'By RecipeShare Community'}
                        ${recipe.created_at ? ' • ' + new Date(recipe.created_at).toLocaleDateString() : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function viewRecipeDetail(recipeId) {
    console.log('Navigating to recipe:', recipeId);
    window.location.href = `/recipe/${recipeId}/`;
}