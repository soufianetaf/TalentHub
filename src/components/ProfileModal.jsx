// src/components/ProfileModal.jsx
import React from 'react';
import { Linkedin, Github, Twitter, MapPin, Building2, Users, Briefcase, Mail, GraduationCap, Award, Code, ExternalLink } from './Icons';

const ProfileModal = ({ cluster, onClose, getLinkedInData, getGitHubData, getTwitterData }) => {
    if (!cluster) return null;

    const linkedin = getLinkedInData(cluster);
    const github = getGitHubData(cluster);
    const twitter = getTwitterData(cluster);
    const original = linkedin.profil_original || {};

    const fullName = original.firstName && original.lastName 
      ? `${original.firstName} ${original.lastName}`
      : linkedin.nom || 'Nom non disponible';

    const photo = original.photo || original.profilePicture?.url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=128`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors z-10">
              <span className="text-2xl">×</span>
            </button>
            
            <div className="flex items-start gap-6 relative z-10">
              <div className="relative">
                <img src={photo} alt={fullName} className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-2xl bg-white" />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-4xl font-bold capitalize mb-2">{fullName}</h2>
                <p className="text-xl mb-4 opacity-90">{original.headline || linkedin.bio?.slice(0, 100)}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize text-sm">{linkedin.localisation || 'Non spécifié'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Building2 className="w-4 h-4" />
                    <span className="capitalize text-sm">{linkedin.organisation || 'Non spécifié'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-wrap gap-4 mb-8">
              {original.linkedinUrl && (
                <a href={original.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  <Linkedin className="w-5 h-5" /> LinkedIn
                </a>
              )}
              {github?.username && (
                <a href={`https://github.com/${github.username}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-md">
                  <Github className="w-5 h-5" /> GitHub
                </a>
              )}
              {twitter?.profil_original?.profile && (
                <a href={twitter.profil_original.profile.startsWith('http') ? twitter.profil_original.profile : `https://twitter.com/${twitter.profil_original.profile}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-md">
                  <Twitter className="w-5 h-5" /> Twitter
                </a>
              )}
              {linkedin.email && (
                <a href={`mailto:${linkedin.email}`}
                   className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md">
                  <Mail className="w-5 h-5" /> Email
                </a>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" /> À propos
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {original.about || linkedin.bio || 'Aucune description disponible'}
              </p>
            </div>

            {original.experience?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-indigo-600" /> Expérience
                </h3>
                <div className="space-y-4">
                  {original.experience.map((exp, idx) => (
                    <div key={idx} className="border-l-4 border-indigo-600 pl-4">
                      <h4 className="font-bold text-lg text-gray-900">{exp.position}</h4>
                      <p className="text-indigo-600 font-medium">{exp.companyName}</p>
                      <p className="text-gray-600 text-sm">{exp.duration || `${exp.startDate?.text || ''} - ${exp.endDate?.text || 'Present'}`}</p>
                      {exp.skills && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exp.skills.slice(0, 6).map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {original.education?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" /> Éducation
                </h3>
                <div className="space-y-4">
                  {original.education.map((edu, idx) => (
                    <div key={idx} className="border-l-4 border-emerald-600 pl-4">
                      <h4 className="font-bold text-lg text-gray-900">{edu.schoolName}</h4>
                      <p className="text-emerald-600 font-medium">{edu.degree} {edu.fieldOfStudy && `- ${edu.fieldOfStudy}`}</p>
                      <p className="text-gray-600 text-sm">{edu.period}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {original.skills?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="w-6 h-6 text-indigo-600" /> Compétences
                </h3>
                <div className="flex flex-wrap gap-2">
                  {original.skills.slice(0, 20).map((skill, idx) => (
                    <span key={idx} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {original.certifications?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-indigo-600" /> Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {original.certifications.slice(0, 6).map((cert, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-gray-900">{cert.title}</h4>
                      <p className="text-indigo-600 text-sm">{cert.issuedBy}</p>
                      <p className="text-gray-600 text-xs mt-1">{cert.issuedAt}</p>
                      {cert.link && (
                        <a href={cert.link} target="_blank" rel="noopener noreferrer" 
                           className="text-indigo-600 text-sm mt-2 inline-flex items-center gap-1 hover:underline">
                          Voir certificat <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {github?.profil_original && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Github className="w-6 h-6" /> GitHub
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{github.profil_original.public_repos}</p>
                    <p className="text-sm text-gray-600">Repos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{github.profil_original.followers}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{github.profil_original.following}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{new Date(github.profil_original.created_at).getFullYear()}</p>
                    <p className="text-sm text-gray-600">Depuis</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
export default ProfileModal;