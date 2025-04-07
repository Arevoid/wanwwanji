const API_TOKEN = 'uskuYtAJttoQJGIHFnXRyNW';
const BASE_URL = 'https://api.vika.cn/fusion/v1/datasheets/dstQvcdxqTTbCiiDxt/records';
const ITEMS_PER_LOAD = 50;
const STORAGE_KEY = 'wwj_users';
const CURRENT_USER_KEY = 'wwj_current_user';

class UserManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
        this.initializeUserEvents();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem(CURRENT_USER_KEY);
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForLoggedInUser();
        }
    }

    initializeUserEvents() {
        // 登录相关
        document.getElementById('showLoginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('showRegisterBtn').addEventListener('click', () => this.showModal('registerModal'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('showFavoritesBtn').addEventListener('click', () => this.toggleFavorites());

        // 关闭模态框
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 表单提交
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // 添加菜单点击事件
        const menuBtn = document.getElementById('menuBtn');
        const menuContainer = menuBtn.parentElement;
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContainer.classList.toggle('active');
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
                menuContainer.classList.remove('active');
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const username = form.querySelector('input[type="text"]').value;
        const password = form.querySelector('input[type="password"]').value;

        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            this.updateUIForLoggedInUser();
            form.reset();
            document.getElementById('loginModal').style.display = 'none';
        } else {
            alert('用户名或密码错误');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const username = form.querySelector('input[type="text"]').value;
        const password = form.querySelectorAll('input[type="password"]')[0].value;
        const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (users.some(u => u.username === username)) {
            alert('用户名已存在');
            return;
        }

        const newUser = {
            username,
            password,
            favorites: []
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        
        this.currentUser = newUser;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        
        this.updateUIForLoggedInUser();
        form.reset();
        document.getElementById('registerModal').style.display = 'none';
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
        this.updateUIForLoggedInUser();
        window.resourceLibrary.renderResources(window.resourceLibrary.resources);
    }

    updateUIForLoggedInUser() {
        const loginButtons = document.getElementById('loginButtons');
        const userInfo = document.getElementById('userInfo');
        const username = document.getElementById('username');
        const favoritesSection = document.getElementById('favoritesSection');
        const logoutSection = document.getElementById('logoutSection');

        if (this.currentUser) {
            loginButtons.style.display = 'none';
            userInfo.style.display = 'block';
            favoritesSection.style.display = 'block';
            logoutSection.style.display = 'block';
            username.textContent = this.currentUser.username;
        } else {
            loginButtons.style.display = 'flex';
            userInfo.style.display = 'none';
            favoritesSection.style.display = 'none';
            logoutSection.style.display = 'none';
            username.textContent = '';
        }
    }

    toggleFavorites() {
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        const isShowingFavorites = showFavoritesBtn.classList.contains('active');
        
        // 关闭菜单
        const menuContainer = document.querySelector('.menu-container');
        if (menuContainer) {
            menuContainer.classList.remove('active');
        }
        
        if (!isShowingFavorites) {
            // 显示收藏的资源
            showFavoritesBtn.classList.add('active');
            const favorites = this.currentUser.favorites;
            const favoriteResources = window.resourceLibrary.resources.filter(
                resource => favorites.includes(resource.recordId)
            );
            window.resourceLibrary.renderResources(favoriteResources, true);
            
            // 添加历史记录
            history.pushState({ showing: 'favorites' }, '', '#favorites');
        } else {
            // 返回所有资源
            this.showAllResources();
        }
    }

    // 添加新方法
    showAllResources() {
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        showFavoritesBtn.classList.remove('active');
        window.resourceLibrary.renderResources(window.resourceLibrary.resources);
        
        // 如果当前在收藏页面，返回上一页
        if (location.hash === '#favorites') {
            history.back();
        }
    }

    toggleFavorite(recordId) {
        if (!this.currentUser) {
            alert('请先登录');
            return;
        }

        const users = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        
        const favoriteIndex = this.currentUser.favorites.indexOf(recordId);
        const card = document.querySelector(`[data-record-id="${recordId}"]`);
        
        if (favoriteIndex === -1) {
            // 添加收藏
            this.currentUser.favorites.push(recordId);
            if (card) {
                // 更新收藏指示器
                const favoriteIndicator = document.createElement('span');
                favoriteIndicator.className = 'favorite-indicator';
                favoriteIndicator.textContent = '♥';
                card.querySelector('.resource-info').appendChild(favoriteIndicator);
                
                // 更新收藏数
                const currentCount = window.resourceLibrary.favoritesCounts.get(recordId) || 0;
                const newCount = currentCount + 1;
                window.resourceLibrary.favoritesCounts.set(recordId, newCount);
                
                // 如果是从0变为1，需要添加收藏显示
                if (currentCount === 0) {
                    const favoriteCount = document.createElement('span');
                    favoriteCount.className = 'favorite-count';
                    favoriteCount.textContent = `收藏 ${newCount}`;
                    card.querySelector('.resource-info').insertBefore(
                        favoriteCount,
                        card.querySelector('.favorite-indicator')
                    );
                } else {
                    const favoriteCountElement = card.querySelector('.favorite-count');
                    if (favoriteCountElement) {
                        favoriteCountElement.textContent = `收藏 ${newCount}`;
                    }
                }
            }
        } else {
            // 取消收藏
            this.currentUser.favorites.splice(favoriteIndex, 1);
            if (card) {
                // 移除收藏指示器
                const favoriteIndicator = card.querySelector('.favorite-indicator');
                if (favoriteIndicator) {
                    favoriteIndicator.remove();
                }
                
                // 更新收藏数
                const currentCount = window.resourceLibrary.favoritesCounts.get(recordId) || 1;
                const newCount = currentCount - 1;
                window.resourceLibrary.favoritesCounts.set(recordId, newCount);
                
                // 如果收藏数变为0，移除收藏数显示
                if (newCount === 0) {
                    const favoriteCountElement = card.querySelector('.favorite-count');
                    if (favoriteCountElement) {
                        favoriteCountElement.remove();
                    }
                } else {
                    const favoriteCountElement = card.querySelector('.favorite-count');
                    if (favoriteCountElement) {
                        favoriteCountElement.textContent = `收藏 ${newCount}`;
                    }
                }
            }
        }

        users[userIndex] = this.currentUser;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));

        // 如果正在查看收藏列表，更新显示
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        if (showFavoritesBtn.classList.contains('active')) {
            const favorites = this.currentUser.favorites;
            const favoriteResources = window.resourceLibrary.resources.filter(
                resource => favorites.includes(resource.recordId)
            );
            window.resourceLibrary.renderResources(favoriteResources, true);
        }

        // 触发动画
        if (card) {
            const indicator = card.querySelector('.long-press-indicator');
            if (indicator) {
                indicator.style.transform = 'scale(1)';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 300);
            }
        }
    }

    isFavorite(recordId) {
        return this.currentUser && this.currentUser.favorites.includes(recordId);
    }
}

class ResourceLibrary {
    constructor() {
        this.resources = [];
        this.displayedItems = ITEMS_PER_LOAD;
        this.searchInput = document.getElementById('searchInput');
        this.resourceList = document.getElementById('resourceList');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.isLoading = false;
        this.favoritesCounts = new Map();
        this.longPressTimeout = null;
        this.longPressDelay = 500; // 长按时间阈值（毫秒）
        
        this.init();
        this.initScrollListener();
        
        // 修改历史状态监听
        window.addEventListener('popstate', (event) => {
            // 阻止默认的返回行为
            event.preventDefault();
            
            if (document.referrer.includes(window.location.host)) {
                // 如果是从资源页面返回
                window.location.replace(window.location.pathname);
            } else if (!event.state || event.state.showing !== 'favorites') {
                // 从收藏页面返回到主页面
                const showFavoritesBtn = document.getElementById('showFavoritesBtn');
                if (showFavoritesBtn.classList.contains('active')) {
                    window.userManager.showAllResources();
                }
            }
        });
    }

    async init() {
        this.bindEvents();
        await this.fetchResources();
    }

    initScrollListener() {
        // 监听窗口滚动事件
        window.addEventListener('scroll', () => {
            if (this.isLoading) return;

            // 检查是否滚动到底部
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight || document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 100) { // 距离底部100px时加载
                this.loadMoreItems();
            }
        });
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => {
            this.displayedItems = ITEMS_PER_LOAD;
            this.filterResources(this.searchInput.value);
        });
    }

    async fetchResources() {
        try {
            this.isLoading = true;
            this.loading.style.display = 'block';

            const response = await fetch(`${BASE_URL}?viewId=viwLlvMFsUVWA&pageSize=1000`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('网络请求失败');
            }

            const data = await response.json();

            if (data && data.success && data.data && Array.isArray(data.data.records)) {
                this.resources = data.data.records;
                this.renderResources(this.resources);
            } else {
                throw new Error('数据格式不正确');
            }
        } catch (error) {
            console.error('获取资源失败:', error);
            this.error.style.display = 'block';
            this.error.textContent = `加载失败: ${error.message}`;
        } finally {
            this.isLoading = false;
            this.loading.style.display = 'none';
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    loadMoreItems() {
        if (this.isLoading || this.displayedItems >= this.filteredResources.length) {
            return;
        }

        this.isLoading = true;
        this.loading.style.display = 'block';

        // 使用setTimeout模拟加载延迟，让加载提示更明显
        setTimeout(() => {
            this.displayedItems += ITEMS_PER_LOAD;
            this.renderResources(this.filteredResources);
            this.isLoading = false;
        }, 300);
    }

    calculateFavoritesCounts() {
        this.favoritesCounts.clear();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // 统计每个资源的收藏数
        users.forEach(user => {
            user.favorites.forEach(recordId => {
                const count = this.favoritesCounts.get(recordId) || 0;
                this.favoritesCounts.set(recordId, count + 1);
            });
        });
    }

    renderResources(resources, isFavoritePage = false) {
        this.filteredResources = resources;
        
        if (!resources.length) {
            this.resourceList.innerHTML = '<div class="error">没有找到资源</div>';
            this.loading.style.display = 'none';
            return;
        }

        // 计算收藏数并排序
        this.calculateFavoritesCounts();
        const sortedResources = [...resources].sort((a, b) => {
            const countA = this.favoritesCounts.get(a.recordId) || 0;
            const countB = this.favoritesCounts.get(b.recordId) || 0;
            return countB - countA; // 降序排列
        });

        const itemsToShow = sortedResources.slice(0, this.displayedItems);

        this.resourceList.innerHTML = itemsToShow.map(resource => {
            const title = resource.fields['标题（点击放大镜搜索关键词）'];
            const url = resource.fields['链接']?.text || resource.fields['链接']?.title || '#';
            const category = resource.fields['分类'] || '';
            const createTime = this.formatDate(resource.fields['创建时间']);
            const favoriteCount = this.favoritesCounts.get(resource.recordId) || 0;
            
            if (!title) return '';
            
            const isFavorite = window.userManager.isFavorite(resource.recordId);
            
            return `
                <div class="resource-card" 
                     data-record-id="${resource.recordId}"
                     ontouchstart="window.resourceLibrary.handleTouchStart(event, '${resource.recordId}')"
                     ontouchend="window.resourceLibrary.handleTouchEnd(event)"
                     ontouchcancel="window.resourceLibrary.handleTouchEnd(event)">
                    <div class="resource-header">
                        <h3 class="resource-title">${title}</h3>
                        ${category ? `<span class="resource-category">${category}</span>` : ''}
                    </div>
                    <div class="resource-footer">
                        <div class="resource-info">
                            <span class="resource-date">${createTime}</span>
                            ${favoriteCount > 0 ? `<span class="favorite-count">收藏 ${favoriteCount}</span>` : ''}
                            ${isFavorite ? '<span class="favorite-indicator">♥</span>' : ''}
                        </div>
                        <div class="resource-actions">
                            ${url !== '#' ? `
                                <a href="${url}" 
                                   class="download-btn" 
                                   onclick="window.resourceLibrary.handleLinkClick(event, '${url}')">
                                   查看资源
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    <div class="long-press-indicator"></div>
                </div>
            `;
        }).join('');

        this.loading.style.display = this.displayedItems < sortedResources.length ? 'block' : 'none';
        this.isLoading = false;
    }

    filterResources(searchTerm) {
        const filtered = this.resources.filter(resource => {
            const title = resource.fields['标题（点击放大镜搜索关键词）'] || '';
            const category = resource.fields['分类'] || '';
            return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   category.toLowerCase().includes(searchTerm.toLowerCase());
        });
        this.renderResources(filtered);
    }

    handleTouchStart(event, recordId) {
        this.touchStartTime = Date.now();
        this.touchStartY = event.touches[0].clientY;
        this.touchStartX = event.touches[0].clientX;
        this.touchRecordId = recordId;
        this.isMoved = false;
        
        const card = event.currentTarget;
        card.querySelector('.long-press-indicator').style.transform = 'scale(0)';
        card.querySelector('.long-press-indicator').style.opacity = '1';
        
        // 设置长按定时器
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
        }
        
        this.longPressTimeout = setTimeout(() => {
            // 只有在没有移动的情况下才触发收藏
            if (!this.isMoved) {
                window.userManager.toggleFavorite(recordId);
                card.querySelector('.long-press-indicator').style.transform = 'scale(1)';
                setTimeout(() => {
                    card.querySelector('.long-press-indicator').style.opacity = '0';
                }, 300);
            }
        }, this.longPressDelay);

        // 添加触摸移动事件监听
        card.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    }

    // 添加触摸移动处理方法
    handleTouchMove(event) {
        if (!this.touchStartY) return;
        
        const touchY = event.touches[0].clientY;
        const touchX = event.touches[0].clientX;
        const deltaY = Math.abs(touchY - this.touchStartY);
        const deltaX = Math.abs(touchX - this.touchStartX);
        
        // 如果移动距离超过阈值，标记为已移动
        if (deltaY > 5 || deltaX > 5) {
            this.isMoved = true;
        }
    }

    handleTouchEnd(event) {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        
        // 重置所有触摸相关状态
        this.touchStartY = null;
        this.touchStartX = null;
        this.isMoved = false;
        this.touchStartTime = 0;
    }

    // 修改链接点击处理方法
    handleLinkClick(event, url) {
        event.preventDefault();
        event.stopPropagation();
        
        // 保存当前状态
        history.pushState({ type: 'main' }, '', window.location.pathname);
        
        // 在当前窗口打开链接
        window.location.href = url;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
    window.resourceLibrary = new ResourceLibrary();
}); 