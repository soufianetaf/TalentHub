// src/components/ExportMenu.jsx
import React, { useState } from 'react';
import { Download, FileText, Table, Code } from './Icons';

const ExportMenu = ({ profiles, getLinkedInData, toast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export CSV
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Nom',
        'Email',
        'Téléphone',
        'Localisation',
        'Organisation',
        'Poste actuel',
        'Compétences principales',
        'Années d\'expérience',
        'Formations',
        'Connexions LinkedIn',
        'GitHub',
        'Twitter',
        'LinkedIn URL'
      ];
      
      const rows = profiles.map(profile => {
        const linkedin = getLinkedInData(profile);
        const original = linkedin.profil_original || {};
        const github = profile.profils?.find(p => p.source === 'github');
        const twitter = profile.profils?.find(p => p.source === 'twitter');
        
        const fullName = original.firstName && original.lastName 
          ? `${original.firstName} ${original.lastName}`
          : linkedin.nom || 'N/A';
        
        const email = linkedin.email || original.email || 'N/A';
        const phone = original.phone || 'N/A';
        const location = linkedin.localisation || 'N/A';
        const organisation = linkedin.organisation || original.positions?.[0]?.companyName || 'N/A';
        const headline = original.headline || 'N/A';
        const skills = original.skills?.slice(0, 10).map(s => s.name).join('; ') || 'N/A';
        const experienceCount = original.experience?.length || 0;
        const education = original.education?.map(e => `${e.degree} - ${e.schoolName}`).join('; ') || 'N/A';
        const connections = original.connectionsCount ? (original.connectionsCount > 500 ? '500+' : original.connectionsCount) : 'N/A';
        const githubUsername = github?.username || 'N/A';
        const twitterHandle = twitter?.profil_original?.profile || 'N/A';
        const linkedinUrl = original.linkedinUrl || 'N/A';
        
        return [
          fullName,
          email,
          phone,
          location,
          organisation,
          headline,
          skills,
          experienceCount,
          education,
          connections,
          githubUsername,
          twitterHandle,
          linkedinUrl
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talenthub_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Export CSV réussi (${profiles.length} profils)`);
    } catch (error) {
      toast.error('❌ Erreur lors de l\'export CSV');
      console.error('CSV Export Error:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  // Export JSON
  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const data = profiles.map(profile => {
        const linkedin = getLinkedInData(profile);
        const original = linkedin.profil_original || {};
        const github = profile.profils?.find(p => p.source === 'github');
        const twitter = profile.profils?.find(p => p.source === 'twitter');
        
        return {
          nom: original.firstName && original.lastName 
            ? `${original.firstName} ${original.lastName}`
            : linkedin.nom,
          email: linkedin.email || original.email,
          telephone: original.phone,
          localisation: linkedin.localisation,
          organisation: linkedin.organisation,
          poste: original.headline,
          bio: linkedin.bio || original.about,
          competences: original.skills?.map(s => s.name) || [],
          experiences: original.experience?.map(exp => ({
            poste: exp.position,
            entreprise: exp.companyName,
            duree: exp.duration,
            description: exp.description
          })) || [],
          formations: original.education?.map(edu => ({
            diplome: edu.degree,
            ecole: edu.schoolName,
            domaine: edu.fieldOfStudy,
            periode: edu.period
          })) || [],
          certifications: original.certifications?.map(cert => ({
            titre: cert.title,
            emetteur: cert.issuedBy,
            date: cert.issuedAt
          })) || [],
          langues: original.languages?.map(lang => ({
            langue: lang.name,
            niveau: lang.proficiency
          })) || [],
          connexions: original.connectionsCount,
          plateformes: {
            linkedin: original.linkedinUrl,
            github: github?.username ? `https://github.com/${github.username}` : null,
            twitter: twitter?.profil_original?.profile
          },
          statistiques: {
            repos_github: github?.profil_original?.public_repos,
            followers_github: github?.profil_original?.followers,
            nombre_plateformes: profile.taille
          },
          date_export: new Date().toISOString()
        };
      });
      
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talenthub_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Export JSON réussi (${profiles.length} profils)`);
    } catch (error) {
      toast.error('❌ Erreur lors de l\'export JSON');
      console.error('JSON Export Error:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  // Export HTML Report
  const exportToHTML = () => {
    setIsExporting(true);
    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TalentHub - Rapport d'Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px 40px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stat-card .number {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stat-card .label {
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 5px;
    }
    .content {
      padding: 40px;
    }
    .profile-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      transition: all 0.3s ease;
      page-break-inside: avoid;
    }
    .profile-card:hover {
      border-color: #667eea;
      box-shadow: 0 10px 25px rgba(102,126,234,0.1);
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f3f4f6;
    }
    .profile-photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #667eea;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .profile-info h2 {
      font-size: 1.75rem;
      color: #111827;
      margin-bottom: 5px;
    }
    .profile-info .headline {
      color: #667eea;
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .profile-info .location {
      color: #6b7280;
      font-size: 0.9rem;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 15px 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-linkedin { background: #dbeafe; color: #1e40af; }
    .badge-github { background: #f3f4f6; color: #1f2937; }
    .badge-twitter { background: #dbeafe; color: #0369a1; }
    .badge-platforms { background: #fef3c7; color: #92400e; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .info-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .info-item .label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .info-item .value {
      font-size: 1rem;
      color: #111827;
      font-weight: 500;
    }
    .skills-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .skills-section h3 {
      font-size: 1rem;
      color: #111827;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .skill-tag {
      padding: 8px 16px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #6d28d9;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .experiences {
      margin-top: 20px;
    }
    .experience-item {
      padding: 15px;
      background: #f9fafb;
      border-radius: 10px;
      margin-bottom: 10px;
      border-left: 4px solid #10b981;
    }
    .experience-item h4 {
      color: #111827;
      font-size: 1.1rem;
      margin-bottom: 5px;
    }
    .experience-item .company {
      color: #667eea;
      font-weight: 500;
      margin-bottom: 3px;
    }
    .experience-item .duration {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #f9fafb;
      color: #6b7280;
      font-size: 0.875rem;
      border-top: 1px solid #e5e7eb;
    }
    .footer strong {
      color: #111827;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .profile-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 TalentHub - Rapport d'Export</h1>
      <p class="subtitle">Date: ${new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="number">${profiles.length}</div>
        <div class="label">Profils Exportés</div>
      </div>
      <div class="stat-card">
        <div class="number">${profiles.filter(p => p.profils?.some(pr => pr.source === 'github')).length}</div>
        <div class="label">Profils GitHub</div>
      </div>
      <div class="stat-card">
        <div class="number">${profiles.filter(p => p.taille === 3).length}</div>
        <div class="label">3 Plateformes</div>
      </div>
      <div class="stat-card">
        <div class="number">${Math.round(profiles.reduce((sum, p) => {
          const linkedin = getLinkedInData(p);
          return sum + (linkedin.profil_original?.skills?.length || 0);
        }, 0) / profiles.length)}</div>
        <div class="label">Compétences / Profil</div>
      </div>
    </div>

    <div class="content">
      ${profiles.map((profile, idx) => {
        const linkedin = getLinkedInData(profile);
        const original = linkedin.profil_original || {};
        const github = profile.profils?.find(p => p.source === 'github');
        const twitter = profile.profils?.find(p => p.source === 'twitter');
        
        const fullName = original.firstName && original.lastName 
          ? `${original.firstName} ${original.lastName}`
          : linkedin.nom || 'Nom non disponible';
        const photo = original.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=667eea&color=fff&size=100`;
        
        return `
        <div class="profile-card">
          <div class="profile-header">
            <img src="${photo}" alt="${fullName}" class="profile-photo" />
            <div class="profile-info">
              <h2>${fullName}</h2>
              <p class="headline">${original.headline || linkedin.bio?.slice(0, 100) || 'N/A'}</p>
              <p class="location">📍 ${linkedin.localisation || 'Localisation non spécifiée'} ${linkedin.organisation ? `• 🏢 ${linkedin.organisation}` : ''}</p>
            </div>
          </div>
          
          <div class="badges">
            ${linkedin ? '<span class="badge badge-linkedin">LinkedIn</span>' : ''}
            ${github ? '<span class="badge badge-github">GitHub</span>' : ''}
            ${twitter ? '<span class="badge badge-twitter">Twitter</span>' : ''}
            ${profile.taille === 3 ? '<span class="badge badge-platforms">⭐ 3 Plateformes</span>' : ''}
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="label">👥 Connexions</div>
              <div class="value">${original.connectionsCount > 500 ? '500+' : original.connectionsCount || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="label">💼 Expériences</div>
              <div class="value">${original.experience?.length || 0}</div>
            </div>
            <div class="info-item">
              <div class="label">🎓 Formations</div>
              <div class="value">${original.education?.length || 0}</div>
            </div>
            ${github ? `
            <div class="info-item">
              <div class="label">💻 Repos GitHub</div>
              <div class="value">${github.profil_original?.public_repos || 0}</div>
            </div>
            ` : ''}
          </div>
          
          ${original.skills?.length > 0 ? `
          <div class="skills-section">
            <h3>💻 Compétences principales</h3>
            <div class="skills-list">
              ${original.skills.slice(0, 15).map(skill => 
                `<span class="skill-tag">${skill.name}</span>`
              ).join('')}
              ${original.skills.length > 15 ? `<span class="skill-tag">+${original.skills.length - 15} autres</span>` : ''}
            </div>
          </div>
          ` : ''}
          
          ${original.experience?.length > 0 ? `
          <div class="experiences">
            <h3 style="margin-bottom: 15px; color: #111827;">💼 Expériences récentes</h3>
            ${original.experience.slice(0, 3).map(exp => `
              <div class="experience-item">
                <h4>${exp.position}</h4>
                <p class="company">${exp.companyName}</p>
                <p class="duration">${exp.duration || `${exp.startDate?.text || ''} - ${exp.endDate?.text || 'Présent'}`}</p>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        `;
      }).join('')}
    </div>

    <div class="footer">
      <p><strong>TalentHub</strong> - Plateforme de Recrutement Cross-Platform</p>
      <p>© ${new Date().getFullYear()} TalentHub. Tous droits réservés.</p>
      <p style="margin-top: 10px;">
        Ce rapport contient ${profiles.length} profil${profiles.length > 1 ? 's' : ''} exporté${profiles.length > 1 ? 's' : ''} le ${new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  </div>
</body>
</html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talenthub_rapport_${new Date().toISOString().split('T')[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(`✅ Rapport HTML généré (${profiles.length} profils)`);
    } catch (error) {
      toast.error('❌ Erreur lors de la génération du rapport');
      console.error('HTML Export Error:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-5 h-5" />
        <span>{isExporting ? 'Export...' : 'Exporter'}</span>
        {profiles.length > 0 && (
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
            {profiles.length}
          </span>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slideUp">
          <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <h3 className="font-bold text-lg mb-1">Exporter les profils</h3>
            <p className="text-sm opacity-90">{profiles.length} profil{profiles.length > 1 ? 's' : ''} sélectionné{profiles.length > 1 ? 's' : ''}</p>
          </div>

          <div className="p-2">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Table className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">CSV (Excel)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Format tableur</p>
              </div>
            </button>

            <button
              onClick={exportToJSON}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">JSON</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Format développeur</p>
              </div>
            </button>

            <button
              onClick={exportToHTML}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Rapport HTML</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rapport professionnel</p>
              </div>
            </button>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 Les fichiers seront téléchargés automatiquement
            </p>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {isOpen && !isExporting && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ExportMenu;