// !! need to hide this key later --------------------------------
const SUPABASE_URL = 'https://jfzojphxhgpejvffefvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c';
// ----------------------------------------------------------------------

let supabaseClient;
let allRecipes = [];
let displayedRecipes = [];
let currentFilter = 'all';
let currentSort = 'latest';
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== PAGE LOADED ===');
    
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✓ Supabase client created');
    } else {
        console.error('✗ Supabase library not loaded');
        document.getElementById('recipesGrid').innerHTML = `
            <div class="no-recipes">
                <div class="no-recipes-icon">😕</div>
                <h3>Failed to load</h3>
                <p>Supabase library is missing. Please refresh the page.</p>
            </div>
        `;
        return;
    }
    
    await getCurrentUser();
    setupAdvancedFilters();
    setupSearchAndFilter();
    await loadRecipes();
    
    console.log('=== SETUP COMPLETE ===');
});

async function getCurrentUser() {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', window.CURRENT_EMAIL)
            .single();
        
        if (data) {
            currentUserId = data.id;
            console.log('✓ Current user ID:', currentUserId);
        } else {
            console.log('⚠ No user found');
        }
    } catch (err) {
        console.error('✗ Error fetching user:', err);
    }
}

function setupAdvancedFilters() {
    console.log('Setting up advanced filters...');
    
    const filterToggle = document.getElementById('filterToggle');
    const filterOptions = document.getElementById('filterOptions');
    const filterChips = document.querySelectorAll('.filter-chip');
    
    if (!filterToggle) {
        console.error('✗ filterToggle not found!');
        return;
    }
    if (!filterOptions) {
        console.error('✗ filterOptions not found!');
        return;
    }
    
    console.log('✓ Found filter toggle and options');
    console.log('✓ Found', filterChips.length, 'filter chips');
    
    // Toggle filter bar
    filterToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const wasExpanded = filterOptions.classList.contains('expanded');
        filterToggle.classList.toggle('active');
        filterOptions.classList.toggle('expanded');
        console.log('>>> Filter toggle clicked - Now', wasExpanded ? 'COLLAPSED' : 'EXPANDED');
    });
    
    // Handle filter chip clicks
    filterChips.forEach((chip, index) => {
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const sortType = chip.dataset.sort;
            console.log('>>> Filter chip clicked:', sortType);
            
            // Remove active class from all chips
            filterChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Update current sort
            currentSort = sortType;
            console.log('>>> Current sort changed to:', currentSort);
            
            // Apply filters
            applyFiltersAndSort();
        });
    });
    
    console.log('✓ Advanced filters setup complete');
}

function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (!searchInput || !filterSelect) {
        console.error('✗ Search input or filter select not found!');
        return;
    }
    
    searchInput.addEventListener('input', (e) => {
        console.log('>>> Search input:', e.target.value);
        applyFiltersAndSort();
    });
    
    filterSelect.addEventListener('change', (e) => {
        console.log('>>> Cuisine filter changed:', e.target.value);
        currentFilter = e.target.value;
        applyFiltersAndSort();
    });
    
    console.log('✓ Search and filter setup complete');
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
    
    console.log('✓ Populated filter options with', cuisines.length, 'cuisines');
}

function applyFiltersAndSort() {
    console.log('=== APPLYING FILTERS ===');
    console.log('Current filter:', currentFilter);
    console.log('Current sort:', currentSort);
    console.log('Total recipes:', allRecipes.length);
    
    let filtered = [...allRecipes];
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Apply cuisine filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(recipe => 
            recipe.cuisine && recipe.cuisine.toLowerCase() === currentFilter.toLowerCase()
        );
        console.log('After cuisine filter:', filtered.length, 'recipes');
    }
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(recipe => {
            const title = recipe.title ? recipe.title.toLowerCase() : '';
            const description = recipe.description ? recipe.description.toLowerCase() : '';
            const ingredients = recipe.ingredients ? JSON.stringify(recipe.ingredients).toLowerCase() : '';
            
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   ingredients.includes(searchTerm);
        });
        console.log('After search filter:', filtered.length, 'recipes');
    }
    
    // Apply sort
    switch(currentSort) {
        case 'latest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            console.log('Sorted by: Latest');
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            console.log('Sorted by: Oldest');
            break;
        case 'most-rated':
            filtered.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
            console.log('Sorted by: Most Rated');
            break;
        case 'favorites':
            filtered = filtered.filter(recipe => recipe.is_favorited);
            console.log('Filtered by: Favorites -', filtered.length, 'recipes');
            break;
        case 'my-recipes':
            filtered = filtered.filter(recipe => recipe.author_id === currentUserId);
            console.log('Filtered by: My Recipes -', filtered.length, 'recipes');
            break;
    }
    
    displayedRecipes = filtered;
    console.log('Final count:', displayedRecipes.length, 'recipes');
    renderRecipes(displayedRecipes);
}

async function loadRecipes() {
    const recipesGrid = document.getElementById('recipesGrid');
    
    try {
        console.log('>>> Fetching recipes from Supabase...');
        
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

        if (error) {
            console.error('✗ Error fetching recipes:', error);
            recipesGrid.innerHTML = `
                <div class="no-recipes">
                    <div class="no-recipes-icon">😕</div>
                    <h3>Failed to load recipes</h3>
                    <p>${error.message || 'Please try refreshing the page'}</p>
                </div>
            `;
            return;
        }

        console.log('✓ Fetched', recipes.length, 'recipes');

        // Fetch ratings and favorites for each recipe
        for (let recipe of recipes) {
            // Get rating count and average
            const { data: ratings } = await supabaseClient
                .from('recipe_ratings')
                .select('rating')
                .eq('recipe_id', recipe.id);
            
            recipe.rating_count = ratings ? ratings.length : 0;
            recipe.average_rating = ratings && ratings.length > 0 
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
                : 0;
            
            // Check if current user favorited this recipe
            if (currentUserId) {
                const { data: favorite } = await supabaseClient
                    .from('recipe_favorites')
                    .select('*')
                    .eq('user_id', currentUserId)
                    .eq('recipe_id', recipe.id)
                    .single();
                
                recipe.is_favorited = !!favorite;
            } else {
                recipe.is_favorited = false;
            }
        }

        allRecipes = recipes || [];
        displayedRecipes = allRecipes;
        
        console.log('✓ Processed all recipes');
        
        populateFilterOptions();
        renderRecipes(displayedRecipes);

    } catch (err) {
        console.error('✗ Error loading recipes:', err);
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
    console.log('>>> Rendering', recipes.length, 'recipes');
    
    const grid = document.getElementById('recipesGrid');
    const recipeCount = document.getElementById('recipeCount');
    const recipesTitle = document.querySelector('.recipes-title');
    
    recipeCount.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`;
    
    // Update title based on filter
    const sortLabels = {
        'latest': 'Latest Recipes',
        'oldest': 'Oldest Recipes',
        'most-rated': 'Most Rated Recipes',
        'favorites': 'Your Favorites',
        'my-recipes': 'Your Recipes'
    };
    
    if (currentFilter !== 'all') {
        recipesTitle.textContent = `${currentFilter} - ${sortLabels[currentSort] || 'Recipes'}`;
    } else {
        recipesTitle.textContent = sortLabels[currentSort] || 'All Recipes';
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
                            ${recipe.is_favorited ? '<span style="color: #ff6b35; font-size: 16px;">⭐</span>' : ''}
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
                            <span>⭐</span>
                            <span>${recipe.average_rating ? recipe.average_rating.toFixed(1) : 'N/A'} (${recipe.rating_count || 0})</span>
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
    
    console.log('✓ Rendered successfully');
}

function viewRecipeDetail(recipeId) {
    console.log('>>> Navigating to recipe:', recipeId);
    window.location.href = `/recipe/${recipeId}/`;
}