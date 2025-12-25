'use client';

import { useEffect } from 'react';

/**
 * Living Interface Behaviors
 * Minimal JavaScript for scroll-triggered animations and metric counting
 */

export function useLivingInterface() {
  useEffect(() => {
    // ============================================
    // 1. Scroll-Triggered Fade-In Observer
    // ============================================
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    // Observe all fade-in sections
    const fadeElements = document.querySelectorAll('.fade-in-section, .stagger-children');
    fadeElements.forEach((el) => fadeObserver.observe(el));

    // ============================================
    // 2. Parallax Scroll Effect
    // ============================================
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    let ticking = false;

    function updateParallax() {
      parallaxElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = 0.5; // Parallax speed multiplier
        
        // Only apply transform if element is in viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const yPos = -(scrolled * rate);
          (el as HTMLElement).style.transform = `translateY(${yPos}px)`;
        }
      });
      
      ticking = false;
    }

    function requestParallaxUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    if (parallaxElements.length > 0) {
      window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
      updateParallax(); // Initial position
    }

    // ============================================
    // 3. Metric Counter Animation
    // ============================================
    const metricObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            const target = entry.target as HTMLElement;
            const text = target.textContent || '';
            const match = text.match(/([+-]?\d+)(%|x)?/);
            
            if (match) {
              const endValue = parseInt(match[1], 10);
              const suffix = match[2] || '';
              const prefix = text.match(/^[+-]/)?.[0] || '';
              const duration = 1500; // Animation duration in ms
              const steps = 60;
              const increment = endValue / steps;
              const stepDuration = duration / steps;
              let currentValue = 0;
              
              target.classList.add('counted', 'counting');
              
              const counter = setInterval(() => {
                currentValue += increment;
                
                if ((increment > 0 && currentValue >= endValue) || 
                    (increment < 0 && currentValue <= endValue)) {
                  currentValue = endValue;
                  clearInterval(counter);
                  target.classList.remove('counting');
                }
                
                target.textContent = `${prefix}${Math.abs(Math.round(currentValue))}${suffix}`;
              }, stepDuration);
            }
            
            metricObserver.unobserve(target);
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all metric elements
    const metricElements = document.querySelectorAll('.living-metric');
    metricElements.forEach((el) => metricObserver.observe(el));

    // ============================================
    // 4. Mouse-Repel Background Elements
    // ============================================
    const repelElements = document.querySelectorAll('.repel-element');
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let repelTicking = false;

    function updateRepelElements() {
      repelElements.forEach((el) => {
        const element = el as HTMLElement;
        const rect = element.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from mouse to element center
        const deltaX = mouseX - elementCenterX;
        const deltaY = mouseY - elementCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only apply repel within 400px radius
        if (distance < 400 && distance > 0) {
          // Inverse direction (repel away from mouse)
          const strength = Math.max(0, (400 - distance) / 400);
          const maxOffset = 8; // Very subtle movement
          const targetX = -(deltaX / distance) * strength * maxOffset;
          const targetY = -(deltaY / distance) * strength * maxOffset;
          
          // Smooth damping (lerp towards target)
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;
        } else {
          // Ease back to neutral position
          currentX *= 0.92;
          currentY *= 0.92;
        }
        
        element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      });
      
      repelTicking = false;
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // DEBUG: Confirm mouse handler is active (only logs on homepage with repel elements)
      if (repelElements.length > 0) {
        console.log('bg mouse', mouseX, mouseY);
      }
      
      if (!repelTicking) {
        window.requestAnimationFrame(updateRepelElements);
        repelTicking = true;
      }
    }

    if (repelElements.length > 0) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // ============================================
    // Cleanup
    // ============================================
    return () => {
      fadeObserver.disconnect();
      metricObserver.disconnect();
      window.removeEventListener('scroll', requestParallaxUpdate);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
}
