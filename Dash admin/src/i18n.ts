import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Les traductions pour les éléments principaux du Dashboard
const resources = {
  fr: {
    translation: {
      "sidebar.dashboard": "Tableau de Bord",
      "sidebar.orders": "Commandes en Direct",
      "sidebar.products": "Menu & Produits",
      "sidebar.categories": "Catégories",
      "sidebar.tables": "Plan des Tables",
      "sidebar.assistance": "Demandes d'Assistance",
      "sidebar.revenue": "Revenus & Finance",
      "sidebar.promotions": "Promotions",
      "sidebar.loyalty": "Fidélité Clients",
      "sidebar.staff": "Équipe & Accès",
      "sidebar.analytics": "Analytiques",
      "sidebar.profile": "Mon Profil",
      "sidebar.logout": "Déconnexion",
      "sidebar.language": "Changer Langue (FR)",
      "sidebar.collapse": "Réduire le menu",

      "dashboard.title": "Aperçu Général",
      "dashboard.live": "En direct",
      "dashboard.auto_refresh": "Actualisation automatique",
      "dashboard.today": "Aujourd'hui",
      "dashboard.week": "Cette Semaine",
      "dashboard.month": "Ce Mois",
      "dashboard.revenue_today": "Revenus du Jour",
      "dashboard.total_orders": "Total Commandes",
      "dashboard.active_orders": "Commandes Actives",
      "dashboard.avg_prep_time": "Temps de Préparation",
      "dashboard.revenue_7_days": "Évolution des Revenus (7 jours)",
      "dashboard.details": "Détails",
      "dashboard.order_status": "Statut des Commandes",
      "dashboard.total_today": "Total Jour",
      "dashboard.status.new": "Nouveau",
      "dashboard.status.brewing": "En Préparation",
      "dashboard.status.ready": "Prêt",
      "dashboard.assistance": "Assistance",
      "dashboard.all_quiet": "Tout est calme",
      "dashboard.no_calls": "Aucun appel serveur.",
      "dashboard.wait_time": "min d'attente",
      "dashboard.table_status": "État des Tables",
      "dashboard.no_tables": "Aucune table configurée",
      "dashboard.live_orders": "Commandes Actives",
      "dashboard.no_orders": "Aucune commande en cours",
      "dashboard.inventory_alerts": "Alerte Rupture",
      "dashboard.left": "restants",
      "dashboard.manage_stock": "Gérer les stocks"
    }
  },
  en: {
    translation: {
      "sidebar.dashboard": "Dashboard",
      "sidebar.orders": "Live Orders",
      "sidebar.products": "Menu & Products",
      "sidebar.categories": "Categories",
      "sidebar.tables": "Table Plan",
      "sidebar.assistance": "Assistance Requests",
      "sidebar.revenue": "Revenue & Finance",
      "sidebar.promotions": "Promotions",
      "sidebar.loyalty": "Customer Loyalty",
      "sidebar.staff": "Staff & Access",
      "sidebar.analytics": "Analytics",
      "sidebar.profile": "My Profile",
      "sidebar.logout": "Logout",
      "sidebar.language": "Change Language (EN)",
      "sidebar.collapse": "Collapse menu",

      "dashboard.title": "General Overview",
      "dashboard.live": "Live",
      "dashboard.auto_refresh": "Auto-refresh",
      "dashboard.today": "Today",
      "dashboard.week": "This Week",
      "dashboard.month": "This Month",
      "dashboard.revenue_today": "Today's Revenue",
      "dashboard.total_orders": "Total Orders",
      "dashboard.active_orders": "Active Orders",
      "dashboard.avg_prep_time": "Prep Time",
      "dashboard.revenue_7_days": "Revenue Evolution (7 days)",
      "dashboard.details": "Details",
      "dashboard.order_status": "Order Status",
      "dashboard.total_today": "Total Today",
      "dashboard.status.new": "New",
      "dashboard.status.brewing": "Preparing",
      "dashboard.status.ready": "Ready",
      "dashboard.assistance": "Assistance",
      "dashboard.all_quiet": "All quiet",
      "dashboard.no_calls": "No server calls.",
      "dashboard.wait_time": "min waiting",
      "dashboard.table_status": "Tables Status",
      "dashboard.no_tables": "No tables configured",
      "dashboard.live_orders": "Live Orders",
      "dashboard.no_orders": "No orders in progress",
      "dashboard.inventory_alerts": "Stock Alert",
      "dashboard.left": "left",
      "dashboard.manage_stock": "Manage stock"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // langue par défaut
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false // React s'en charge
    }
  });

export default i18n;
