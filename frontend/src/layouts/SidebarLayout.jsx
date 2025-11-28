import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../modules/ms-02-authentication/hooks/useAuth.jsx";
import { sidebarConfig } from "./components/sidebarConfig.js";

export default function SidebarLayout({ children }) {
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved ? JSON.parse(saved) : ['assets', 'operations', 'users', 'accounting', 'reports', 'settings'];
  });

  const navItems = sidebarConfig;

  // Función para verificar si el usuario tiene acceso a una opción
  const hasAccess = (item) => {
    if (!item.requiredRole && !item.requiredPermission) {
      return true; // Sin restricciones
    }

    const userRoles = user?.roles || [];
    const userPermissions = user?.permissions || [];

    // Verificar rol requerido
    if (item.requiredRole && !userRoles.includes(item.requiredRole)) {
      return false;
    }

    // Verificar permiso requerido
    if (item.requiredPermission && !userPermissions.includes(item.requiredPermission)) {
      return false;
    }

    return true;
  };

  const toggleSection = (key) => {
    const newExpanded = expandedSections.includes(key)
      ? expandedSections.filter(k => k !== key)
      : [...expandedSections, key];
    setExpandedSections(newExpanded);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newExpanded));
  };

  const renderIcon = (iconName, size = "16", strokeColor = "white") => {
    const icons = {
      chart: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17v-6M8 17v-3" />
        </svg>
      ),
      box: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      swap: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      ),
      users: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      calculator: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="14" />
          <line x1="8" y1="14" x2="8" y2="14" />
          <line x1="12" y1="14" x2="12" y2="14" />
          <line x1="16" y1="18" x2="16" y2="18" />
          <line x1="8" y1="18" x2="8" y2="18" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </svg>
      ),
      report: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      cog: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
        </svg>
      ),
      // Iconos para submenús
      package: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      tag: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      truck: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      "map-pin": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      "arrow-right": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      ),
      "file-text": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      clipboard: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
      tool: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      user: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      "user-check": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      building: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
      ),
      briefcase: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      "trending-down": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      ),
      trash: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
      "dollar-sign": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      "bar-chart": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ),
      shield: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      bell: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      settings: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
        </svg>
      ),
      lock: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      list: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      "shield-check": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      "building-2": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M9 8h1" />
          <path d="M9 12h1" />
          <path d="M9 16h1" />
          <path d="M14 8h1" />
          <path d="M14 12h1" />
          <path d="M14 16h1" />
          <path d="M6 3v18" />
          <path d="M18 3v18" />
          <path d="M6 3h12" />
        </svg>
      ),
      "credit-card": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
      receipt: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 17V7" />
        </svg>
      ),
      "user-plus": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      "git-branch": (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      )
    };
    return icons[iconName] || icons.box;
  };

  // Encabezados de sección sobrios (no afecta rutas ni permisos)
  const renderSectionHeader = (key) => {
    // No mostrar encabezados cuando el sidebar está colapsado
    if (isCollapsed) return null;

    const sections = {
      dashboard: "GENERAL",
      assets: "MÓDULOS",
      accounting: "GESTIÓN CONTABLE",
      reports: "ANÁLISIS",
      settings: "SISTEMA"
    };
    const label = sections[key];
    if (!label) return null;
    return (
      <li key={`section-${key}`} className="px-4 pt-4 pb-2">
        <span className="text-[11px] tracking-wide text-slate-100 font-semibold select-none uppercase opacity-70">
          {label}
        </span>
      </li>
    );
  };

  const handleLogout = async () => {
    // Mostrar loading moderno sin botones
    Swal.fire({
      html: `
        <div style="padding: 40px 20px;">
          <div style="display: flex; justify-content: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; border: 4px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          </div>
          <h2 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Cerrando sesión</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Por favor espera un momento...</p>
        </div>
        <style>
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
        </style>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCancelButton: false,
      showDenyButton: false,
      showCloseButton: false,
      background: '#ffffff',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        actions: 'hidden'
      }
    });

    try {
      await logout();
      // Redirigir al login sin mostrar alerta
      window.location.href = "/login";
    } catch {
      Swal.fire({
        html: `
          <div style="padding: 40px 20px;">
            <div style="display: flex; justify-content: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
            <h2 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 8px 0;">Error</h2>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">No se pudo cerrar la sesión</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
        showCancelButton: false,
        showDenyButton: false,
        showCloseButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: '#ffffff',
        backdrop: 'rgba(0, 0, 0, 0.4)',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          actions: 'hidden'
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - FIXED */}
      <aside
        className={`${isCollapsed ? "w-20" : "w-64"
          } text-slate-100 flex flex-col shadow-lg fixed left-0 top-0 h-screen transition-all duration-300 z-40 border-r border-slate-700/30 overflow-hidden`}
        style={{ background: '#1E293B' }}
      >
        {/* Contenedor para elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Elemento decorativo diagonal - División visible */}
          <svg
            className="absolute left-0 w-full"
            style={{ top: '50%', height: '55%' }}
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="diagonalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0E121B', stopOpacity: 0.8 }} />
                <stop offset="50%" style={{ stopColor: '#0E121B', stopOpacity: 0.95 }} />
                <stop offset="100%" style={{ stopColor: '#0E121B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M 0,80 Q 80,40 160,60 T 300,50 L 300,400 L 0,400 Z"
              fill="url(#diagonalGradient)"
            />
            <path
              d="M 0,80 Q 80,40 160,60 T 300,50"
              fill="none"
              stroke="rgba(30, 41, 59, 0.6)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        {/* Header con logo y botón toggle */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-700/70 flex-shrink-0 relative z-10">
          <div className="flex items-center justify-center flex-1 px-2">
            <img
              src="/src/assets/images/logo.png"
              alt="SIPREB Logo"
              className="h-16 w-auto object-contain rounded-xl max-w-full"
            />
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""
                }`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <nav className="px-2 py-6 flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {navItems.filter(item => hasAccess(item)).map((item) => (
              <React.Fragment key={item.key}>
                {renderSectionHeader(item.key)}
                <li>
                  {/* Item sin hijos (Dashboard) */}
                  {!item.children ? (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative group w-full flex items-center gap-4 px-6 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${isActive
                          ? "text-white bg-[#1E3A5F] rounded-3xl shadow-2xl shadow-black/40"
                          : "text-white hover:text-white hover:bg-slate-800/40 hover:translate-x-0.5 rounded-lg"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <>
                              {/* Línea vertical izquierda brillante */}
                              <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#60A5FA] rounded-full"></span>
                              {/* Línea vertical derecha brillante blanca */}
                              <span className="absolute right-0 top-2 bottom-2 w-1 bg-gradient-to-b from-white/80 via-white/90 to-white/80 rounded-full"></span>
                            </>
                          )}
                          <span className="inline-flex items-center justify-center flex-shrink-0 relative z-10 text-white">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                          </span>
                          {!isCollapsed && (
                            <span className="text-xl relative z-10 text-white font-bold tracking-wide">
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ) : (
                    /* Item con hijos (secciones colapsables) */
                    <div>
                      <button
                        onClick={() => toggleSection(item.key)}
                        className={`relative group overflow-hidden w-full flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-150 text-slate-200 hover:text-white hover:bg-slate-800/40 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${expandedSections.includes(item.key) ? "bg-slate-800/40 border-l-2 border-indigo-500 -ml-0.5 text-white" : ""
                          }`}
                      >
                        <span className="pointer-events-none absolute left-0 top-0 h-full w-0 bg-indigo-500 transition-all duration-200 group-hover:w-0.5 before:content-['']"></span>
                        <span className="inline-flex items-center justify-center flex-shrink-0 text-current">
                          {renderIcon(item.icon, "18", "currentColor")}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform duration-200 ${expandedSections.includes(item.key) ? 'rotate-180' : ''
                                }`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </>
                        )}
                      </button>

                      {/* Submenú */}
                      {!isCollapsed && expandedSections.includes(item.key) && (
                        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-slate-600/50 relative z-20">
                          {item.children.filter(child => hasAccess(child)).map((child) => (
                            <li key={child.key}>
                              <NavLink
                                to={child.path}
                                className={({ isActive }) =>
                                  `w-full flex items-center gap-2 px-4 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 relative z-20 ${!child.implemented ? "opacity-60 cursor-not-allowed" : ""
                                  } ${isActive
                                    ? "text-indigo-300 font-semibold border-l-2 border-indigo-400 -ml-0.5 bg-slate-800/40"
                                    : "text-slate-200 hover:text-white hover:bg-slate-700/50 hover:translate-x-1 hover:border-l-2 hover:border-indigo-400 hover:-ml-0.5"
                                  }`
                                }
                                onClick={(e) => {
                                  if (!child.implemented) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span className={isActive ? "text-indigo-300" : "text-slate-300"}>
                                      {child.icon ? renderIcon(child.icon, "14", isActive ? "currentColor" : "currentColor") : "├─"}
                                    </span>
                                    <span className="flex-1 font-medium">{child.label}</span>
                                    {child.badge && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        {child.badge}
                                      </span>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-4 text-slate-200 text-xs border-t border-slate-700/50 flex-shrink-0 relative z-10 bg-[#0E121B]">
            {user?.roles && user.roles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {user.roles.map((role, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm ${role === 'SUPER_ADMIN'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500/50'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-500/50'
                      }`}
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            <div className="mb-1.5 text-slate-300 font-medium">v0.0.0</div>
            <div className="text-slate-400">© Sistema Administrativo</div>
          </div>
        )}
      </aside>

      {/* Main content - con margen para el sidebar */}
      <div
        className={`flex-1 flex flex-col bg-slate-50 min-h-screen transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"
          }`}
      >
        {/* 🔹 Top Navbar - FIXED */}
        <header
          className="h-20 bg-[#3F4555] flex items-center justify-between px-6 border-b border-slate-600/50 shadow-sm fixed top-0 right-0 z-30 transition-all duration-300"
          style={{ left: isCollapsed ? "5rem" : "16rem" }}
        >
          {/* Logo + título */}
          <div className="flex items-center gap-3">
            <div className="bg-[#4F5BA8] text-white font-bold px-3 py-2 rounded-md text-sm">
              SL
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                SIPREB
              </h1>
              <p className="text-slate-300 text-xs">
                Plataforma Administrativa
              </p>
            </div>
          </div>

          {/* Usuario y Notificaciones */}
          <div className="flex items-center gap-7">
            {/* Campanita de notificaciones */}
            <button
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Notificaciones"
              onClick={() => {
                Swal.fire({
                  title: "Notificaciones",
                  html: '<p class="text-sm text-gray-600">No tienes notificaciones nuevas</p>',
                  icon: "info",
                  confirmButtonColor: "#4f46e5",
                  confirmButtonText: "Cerrar",
                });
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Badge de notificaciones */}
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-4">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              <span className="text-slate-300 text-sm">En línea</span>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                {user?.nombre || user?.email || "Usuario"}
              </p>
              <p className="text-slate-400 text-xs">
                {user?.rol || "Administrador"}
              </p>
            </div>

            {/* Avatar con menú desplegable */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {(user?.nombre || user?.email || "U").charAt(0).toUpperCase()}
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <>
                  {/* Overlay para cerrar el menú al hacer clic fuera */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>

                  {/* Menú */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    {/* Header del menú */}
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.nombre || "Usuario"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.email || "usuario@sipreb.com"}
                      </p>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          Swal.fire({
                            title: "Editar Perfil",
                            text: "Funcionalidad en desarrollo",
                            icon: "info",
                            confirmButtonColor: "#4f46e5",
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Editar Perfil
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          Swal.fire({
                            title: "Configuración",
                            text: "Funcionalidad en desarrollo",
                            icon: "info",
                            confirmButtonColor: "#4f46e5",
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
                        </svg>
                        Configuración
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          Swal.fire({
                            title: "Preferencias",
                            text: "Funcionalidad en desarrollo",
                            icon: "info",
                            confirmButtonColor: "#4f46e5",
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2v6.5" />
                          <path d="M12 15.5V22" />
                          <path d="M4.93 4.93l4.24 4.24" />
                          <path d="M14.83 14.83l4.24 4.24" />
                          <path d="M2 12h6.5" />
                          <path d="M15.5 12H22" />
                          <path d="M4.93 19.07l4.24-4.24" />
                          <path d="M14.83 9.17l4.24-4.24" />
                        </svg>
                        Preferencias
                      </button>

                      <div className="border-t border-slate-200 my-2"></div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal - con padding-top para el header fijo */}
        <main className="flex-1 p-6 mt-20 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
