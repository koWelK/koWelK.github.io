/**
 * product.js — 作品展示页独立逻辑
 * IIFE 包裹，不与 main.js 冲突
 */
(function() {
    'use strict';

    // ============================================================
    //  1. 加载控制
    // ============================================================
    var loader = document.getElementById('product-loader');
    var progressFill = document.getElementById('progressFill');
    var progressLabel = document.getElementById('progressLabel');
    var isLoaded = false;
    var loadStartTime = Date.now();
    var MAX_LOAD_TIME = 5000;

    var allowIntro = false;
    var introDelay = 2000;
    var observer = null;

    function updateProgress(value) {
        var clamped = Math.min(Math.max(value, 0), 100);
        if (progressFill) progressFill.style.width = clamped + '%';
        if (progressLabel) progressLabel.textContent = Math.round(clamped) + '%';
    }

    function hideLoader() {
        if (isLoaded) return;
        isLoaded = true;
        if (loader) {
            loader.classList.add('hidden');
        }
        setTimeout(function() {
            allowIntro = true;
            var coverLeft = document.querySelector('.product-cover-left');
            if (coverLeft) coverLeft.classList.add('cover-shifted');
            insertMoreButton();
            triggerVisibleCheck();
            console.log('✅ 延迟结束，介绍区已允许显示');
        }, introDelay);
    }

    function triggerVisibleCheck() {
        var elements = document.querySelectorAll('.product-animate-up:not(.is-visible)');
        var winHeight = window.innerHeight || document.documentElement.clientHeight;
        elements.forEach(function(el) {
            var rect = el.getBoundingClientRect();
            if (rect.top < winHeight && rect.bottom > 0) {
                el.classList.add('is-visible');
                if (observer) {
                    observer.unobserve(el);
                }
            }
        });
    }

    function insertMoreButton() {
        var meta = document.querySelector('.product-meta');
        if (!meta) return;
        if (document.querySelector('.product-more-btn')) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'product-more-btn';
        var btn = document.createElement('button');
        btn.textContent = '了解更多 ↓';
        btn.className = 'product-more-button';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // ⭐ 跳转到下载区
            var downloadSection = document.getElementById('download-section');
            if (!downloadSection) return;

            window.__productScrolling = true;
            downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            var onScrollEnd = function() {
                window.__productScrolling = false;
                triggerVisibleCheck();
                document.removeEventListener('scrollend', onScrollEnd);
                console.log('🔄 滚动结束，恢复 Observer');
            };
            document.addEventListener('scrollend', onScrollEnd);

            setTimeout(function() {
                if (window.__productScrolling) {
                    window.__productScrolling = false;
                    triggerVisibleCheck();
                    document.removeEventListener('scrollend', onScrollEnd);
                    console.log('🔄 滚动超时，强制恢复');
                }
            }, 1000);
        });
        wrapper.appendChild(btn);
        meta.parentNode.insertBefore(wrapper, meta.nextSibling);
    }

    function preloadImages() {
        var images = document.querySelectorAll('.product-cover-right img, .product-intro-image img');
        var total = images.length;
        if (total === 0) {
            updateProgress(100);
            setTimeout(hideLoader, 400);
            return;
        }

        var loadedCount = 0;

        function onImageLoad() {
            if (isLoaded) return;
            loadedCount++;
            var progress = (loadedCount / total) * 100;
            updateProgress(progress);
            if (loadedCount >= total) {
                hideLoader();
            }
        }

        images.forEach(function(img) {
            if (img.complete && img.naturalWidth !== 0) {
                onImageLoad();
            } else {
                img.addEventListener('load', onImageLoad);
                img.addEventListener('error', function() {
                    onImageLoad();
                });
            }
        });

        var remaining = MAX_LOAD_TIME - (Date.now() - loadStartTime);
        var timeout = Math.max(remaining, 500);
        setTimeout(function() {
            if (!isLoaded) {
                updateProgress(100);
                setTimeout(hideLoader, 300);
            }
        }, timeout);
    }

    // ============================================================
    //  2. 滚动触发动画
    // ============================================================
    var animationsInitiated = false;

    function initScrollAnimations() {
        if (animationsInitiated) return;
        animationsInitiated = true;

        var elements = document.querySelectorAll('.product-animate-up');
        if (elements.length === 0) return;

        observer = new IntersectionObserver(function(entries) {
            if (window.__productScrolling) {
                return;
            }

            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    if (!allowIntro) return;

                    requestAnimationFrame(function() {
                        var el = entry.target;
                        if (!el.classList.contains('is-visible')) {
                            el.classList.add('is-visible');
                            observer.unobserve(el);
                        }
                    });
                }
            });
        }, {
            threshold: 0.02,
            rootMargin: '0px'
        });

        elements.forEach(function(el) {
            if (!el.classList.contains('is-visible')) {
                observer.observe(el);
            }
        });
    }

    // ============================================================
    //  3. 启动流程
    // ============================================================
    updateProgress(0);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initScrollAnimations();
        });
    } else {
        initScrollAnimations();
    }

    requestAnimationFrame(function() {
        preloadImages();
    });

    console.log('✅ product.js 已加载（支持平滑滚动，滚动期间不会触发动画）');
})();