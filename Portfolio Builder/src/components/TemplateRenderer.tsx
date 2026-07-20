import React, { useState } from 'react';
import { Portfolio, Project } from '../types';
import { Github, Linkedin, Twitter, Mail, Phone, MapPin, ExternalLink, ArrowRight, Layers, Cpu, Award } from 'lucide-react';

interface TemplateRendererProps {
  portfolio: Portfolio;
  projects: Project[];
  isPreview?: boolean;
}

export default function TemplateRenderer({ portfolio, projects, isPreview = false }: TemplateRendererProps) {
  const {
    name,
    bio,
    profilePhoto,
    email,
    phone,
    location,
    socialGithub,
    socialLinkedin,
    socialTwitter,
    templateId,
    sectionsOrder,
    skills,
  } = portfolio;

  // Filter projects by category
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))];

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  // Sorting projects by order descending (or ascending)
  const sortedProjects = [...filteredProjects].sort((a, b) => a.order - b.order);

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  // Render Social Links Helper
  const renderSocials = (iconSize = 20) => (
    <div className="flex gap-4 items-center">
      {socialGithub && (
        <a
          href={socialGithub.startsWith('http') ? socialGithub : `https://github.com/${socialGithub}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:opacity-80"
          title="GitHub Profile"
        >
          <Github size={iconSize} />
        </a>
      )}
      {socialLinkedin && (
        <a
          href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://linkedin.com/in/${socialLinkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:opacity-80"
          title="LinkedIn Profile"
        >
          <Linkedin size={iconSize} />
        </a>
      )}
      {socialTwitter && (
        <a
          href={socialTwitter.startsWith('http') ? socialTwitter : `https://twitter.com/${socialTwitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:opacity-80"
          title="Twitter Profile"
        >
          <Twitter size={iconSize} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="transition-colors hover:opacity-80"
          title="Email"
        >
          <Mail size={iconSize} />
        </a>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // TEMPLATE 1: MODERN MINIMALIST (Light, elegant, clean sans typography, spacious)
  // ---------------------------------------------------------------------------
  if (templateId === 'modern') {
    return (
      <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans antialiased selection:bg-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-24 md:space-y-36">
          
          {/* Header */}
          <header className="flex justify-between items-center border-b border-neutral-100 pb-6">
            <span className="font-medium tracking-tight text-lg">{name}</span>
            <div className="text-neutral-500">
              {renderSocials(18)}
            </div>
          </header>

          {/* Render Sections in configured order */}
          {sectionsOrder.map((section) => {
            switch (section) {
              case 'hero':
                return (
                  <section id="hero" key="hero" className="space-y-8 animate-fade-in">
                    <div className="flex flex-col-reverse md:flex-row gap-8 justify-between items-start">
                      <div className="space-y-6 max-w-xl">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 leading-tight">
                          Hi, I'm <span className="text-neutral-800">{name}</span>.
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light">
                          {bio || "A passionate creator building elegant digital solutions."}
                        </p>
                        <div className="pt-2">
                          <a
                            href="#projects"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors"
                          >
                            View Projects <ArrowRight size={16} />
                          </a>
                        </div>
                      </div>
                      {profilePhoto ? (
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 self-center md:self-start">
                          <img
                            src={profilePhoto}
                            alt={name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400 self-center md:self-start">
                          <Award size={48} className="stroke-1" />
                        </div>
                      )}
                    </div>
                  </section>
                );

              case 'about':
                return (
                  <section id="about" key="about" className="space-y-6 border-t border-neutral-100 pt-16">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">About Me</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-4 text-neutral-600 leading-relaxed font-light text-base">
                        <p>{bio || "No biography provided yet."}</p>
                      </div>
                      <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-4">
                        <h3 className="font-semibold text-neutral-900 text-sm tracking-wide uppercase">Details</h3>
                        <div className="space-y-3 text-sm text-neutral-600">
                          {location && (
                            <div className="flex items-center gap-2.5">
                              <MapPin size={16} className="text-neutral-400" />
                              <span>{location}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-2.5">
                              <Mail size={16} className="text-neutral-400" />
                              <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-2.5">
                              <Phone size={16} className="text-neutral-400" />
                              <span>{phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );

              case 'skills':
                if (!skills || skills.length === 0) return null;
                return (
                  <section id="skills" key="skills" className="space-y-8 border-t border-neutral-100 pt-16">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">My Skills</h2>
                    <div className="grid sm:grid-cols-2 gap-8">
                      {Object.entries(skillsByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-4">
                          <h3 className="font-medium text-neutral-800 text-sm tracking-wide uppercase border-b border-neutral-100 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {items.map((skill, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-neutral-700">{skill.name}</span>
                                  <span className="text-neutral-400 font-mono text-xs">{skill.level}%</span>
                                </div>
                                <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-neutral-900 rounded-full"
                                    style={{ width: `${skill.level}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );

              case 'projects':
                if (!projects || projects.length === 0) return null;
                return (
                  <section id="projects" key="projects" className="space-y-8 border-t border-neutral-100 pt-16">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
                      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Featured Work</h2>
                      {/* Categories filter */}
                      {categories.length > 2 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1.5 rounded-full transition-all border ${
                                selectedCategory === cat
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {sortedProjects.map((project) => (
                        <div
                          key={project.projectId}
                          className="group border border-neutral-100 rounded-2xl bg-white hover:border-neutral-200 transition-all overflow-hidden flex flex-col h-full"
                        >
                          {project.imageUrl && (
                            <div className="h-48 overflow-hidden bg-neutral-50 border-b border-neutral-100 relative">
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-white/90 backdrop-blur-xs text-neutral-800 rounded-full border border-neutral-200/50">
                                {project.category}
                              </span>
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-grow space-y-4">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg text-neutral-900 leading-tight">
                                {project.title}
                              </h3>
                              <p className="text-sm text-neutral-600 font-light line-clamp-3">
                                {project.description}
                              </p>
                            </div>

                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {project.tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-md font-light"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 pt-4 mt-auto text-sm">
                              {project.demoUrl && (
                                <a
                                  href={project.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-medium text-neutral-900 hover:underline"
                                >
                                  Live Demo <ExternalLink size={14} />
                                </a>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                                >
                                  Codebase <Github size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );

              case 'contact':
                return (
                  <section id="contact" key="contact" className="space-y-8 border-t border-neutral-100 pt-16">
                    <div className="space-y-4 text-center max-w-xl mx-auto">
                      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Let's Connect</h2>
                      <p className="text-neutral-600 font-light">
                        Interested in collaborating or just want to chat? Send an email or connect on social media.
                      </p>
                      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                          href={`mailto:${email}`}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                          Send Email <Mail size={16} />
                        </a>
                        <div className="flex gap-4 p-3 px-5 border border-neutral-100 rounded-xl bg-white text-neutral-600">
                          {renderSocials(18)}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              default:
                return null;
            }
          })}

          {/* Footer */}
          <footer className="text-center text-xs text-neutral-400 border-t border-neutral-100 pt-12">
            <p>© {new Date().getFullYear()} {name}. Built using Portfolio Builder.</p>
          </footer>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TEMPLATE 2: CREATIVE / DARK TECH (Futuristic dark, jetbrains mono accents, emerald cyber highlights)
  // ---------------------------------------------------------------------------
  if (templateId === 'creative') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-mono antialiased selection:bg-emerald-900/30 selection:text-emerald-400">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 space-y-24 md:space-y-36">

          {/* Header */}
          <header className="flex justify-between items-center border-b border-emerald-950/40 pb-6 text-xs text-slate-400">
            <div>
              <span className="text-emerald-400">~/</span>{name.toLowerCase().replace(/\s+/g, '')}
            </div>
            <div>
              {renderSocials(16)}
            </div>
          </header>

          {/* Sections */}
          {sectionsOrder.map((section) => {
            switch (section) {
              case 'hero':
                return (
                  <section id="hero" key="hero" className="space-y-8">
                    <div className="flex flex-col-reverse md:flex-row gap-8 justify-between items-start">
                      <div className="space-y-6 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 rounded-md text-xs">
                          <Cpu size={14} /> SYSTEM: ACTIVE
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                          HELLO WORLD. I AM <span className="text-emerald-400">{name.toUpperCase()}</span>.
                        </h1>
                        <p className="text-sm md:text-base text-slate-400 leading-relaxed font-light">
                          {bio || "Creative tech artisan transforming complex queries into smooth interactive structures."}
                        </p>
                        <div className="pt-2">
                          <a
                            href="#projects"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 rounded-md text-sm font-medium bg-emerald-950/10 hover:bg-emerald-950/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                          >
                            RUN_PROJECTS_QUERY <ArrowRight size={14} />
                          </a>
                        </div>
                      </div>
                      {profilePhoto ? (
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-2 border-emerald-900/50 bg-slate-900 shrink-0 self-center md:self-start group">
                          <img
                            src={profilePhoto}
                            alt={name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300"
                          />
                          <div className="absolute inset-0 border border-emerald-500/10 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-slate-900 border-2 border-dashed border-emerald-950 flex items-center justify-center shrink-0 text-emerald-800 self-center md:self-start">
                          <Cpu size={40} className="animate-pulse" />
                        </div>
                      )}
                    </div>
                  </section>
                );

              case 'about':
                return (
                  <section id="about" key="about" className="space-y-6 border-t border-emerald-950/40 pt-16">
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                      <span className="text-emerald-400">//</span> ABOUT_PROFILE
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-4 text-slate-400 text-sm leading-relaxed">
                        <p>{bio || "Biographical database is empty."}</p>
                      </div>
                      <div className="bg-slate-900/50 p-6 rounded-lg border border-emerald-950/60 space-y-4 text-xs text-slate-400">
                        <h3 className="font-bold text-emerald-400 tracking-wider uppercase">Meta Config</h3>
                        <div className="space-y-2">
                          {location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-emerald-500" />
                              <span>{location.toUpperCase()}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-emerald-500" />
                              <a href={`mailto:${email}`} className="hover:text-emerald-400">{email}</a>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-emerald-500" />
                              <span>{phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );

              case 'skills':
                if (!skills || skills.length === 0) return null;
                return (
                  <section id="skills" key="skills" className="space-y-8 border-t border-emerald-950/40 pt-16">
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                      <span className="text-emerald-400">//</span> CAPABILITIES_MAP
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-8">
                      {Object.entries(skillsByCategory).map(([category, items]) => (
                        <div key={category} className="space-y-4 bg-slate-900/30 p-5 rounded-lg border border-emerald-950/30">
                          <h3 className="font-bold text-emerald-500 text-xs tracking-wider uppercase pb-2 border-b border-emerald-950/30">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {items.map((skill, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-300">{skill.name}</span>
                                  <span className="text-emerald-400 font-mono">{skill.level}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-950 rounded-xs overflow-hidden border border-emerald-950/50">
                                  <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${skill.level}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );

              case 'projects':
                if (!projects || projects.length === 0) return null;
                return (
                  <section id="projects" key="projects" className="space-y-8 border-t border-emerald-950/40 pt-16">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
                      <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        <span className="text-emerald-400">//</span> EXECUTED_OBJECTS
                      </h2>
                      {categories.length > 2 && (
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-2.5 py-1 rounded transition-all border ${
                                selectedCategory === cat
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
                                  : 'bg-slate-950 text-slate-400 border-emerald-950/40 hover:border-emerald-900'
                              }`}
                            >
                              {cat.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {sortedProjects.map((project) => (
                        <div
                          key={project.projectId}
                          className="group border border-emerald-950 bg-slate-950 hover:border-emerald-800/60 transition-all rounded-md overflow-hidden flex flex-col h-full hover:shadow-[0_0_20px_rgba(16,185,129,0.02)]"
                        >
                          {project.imageUrl && (
                            <div className="h-44 overflow-hidden bg-slate-900 border-b border-emerald-950 relative">
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90 transition-all duration-300"
                              />
                              <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] uppercase tracking-wider bg-slate-950/90 text-emerald-400 rounded border border-emerald-900/50">
                                {project.category.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-grow space-y-4">
                            <div className="space-y-2">
                              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                                &gt; {project.title.toUpperCase()}
                              </h3>
                              <p className="text-xs text-slate-400 leading-relaxed font-light line-clamp-3">
                                {project.description}
                              </p>
                            </div>

                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {project.tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 text-[10px] text-emerald-500 bg-emerald-950/10 border border-emerald-950/50 rounded"
                                  >
                                    [{tag.toLowerCase()}]
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 pt-2 mt-auto text-xs">
                              {project.demoUrl && (
                                <a
                                  href={project.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:underline"
                                >
                                  DEPLOYED_VIEW <ExternalLink size={12} />
                                </a>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                                >
                                  SRC_CODE <Github size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );

              case 'contact':
                return (
                  <section id="contact" key="contact" className="space-y-8 border-t border-emerald-950/40 pt-16">
                    <div className="space-y-6 text-center max-w-xl mx-auto border border-dashed border-emerald-900/40 p-8 rounded-lg bg-emerald-950/5">
                      <h2 className="text-base font-bold text-white tracking-widest uppercase">
                        // INITIALIZE_SESSION
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ready to connect? Launch an email request, or discover social endpoint configurations listed below.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                          href={`mailto:${email}`}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded font-bold text-xs tracking-wider uppercase transition-colors"
                        >
                          LAUNCH_MAIL_CLI <Mail size={14} />
                        </a>
                        <div className="flex gap-4 p-2 px-4 border border-emerald-950 rounded bg-slate-950 text-slate-400">
                          {renderSocials(14)}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              default:
                return null;
            }
          })}

          {/* Footer */}
          <footer className="text-center text-[10px] text-slate-600 border-t border-emerald-950/30 pt-12">
            <p>SYSTEM.CONFIG: STABLE | © {new Date().getFullYear()} {name.toUpperCase()}</p>
          </footer>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TEMPLATE 3: PROFESSIONAL / CORPORATE (Clean grid, navy/slate deep indigo accents, high polish)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Banner Accent */}
      <div className="h-2 bg-indigo-600 w-full" />

      {/* Main Body container */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-20 md:space-y-28">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-indigo-600 rounded-full" />
            <span className="font-bold tracking-tight text-xl text-slate-900">{name}</span>
          </div>
          <div className="text-slate-500">
            {renderSocials(18)}
          </div>
        </header>

        {/* Content sections loop */}
        {sectionsOrder.map((section) => {
          switch (section) {
            case 'hero':
              return (
                <section id="hero" key="hero" className="bg-white p-8 md:p-12 rounded-3xl shadow-xs border border-slate-200/60 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full filter blur-3xl -z-10 opacity-60" />
                  <div className="flex flex-col-reverse md:flex-row gap-8 justify-between items-center relative z-10">
                    <div className="space-y-6 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                        <Award size={14} /> Available for projects
                      </div>
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                        Elevating businesses through digital craft.
                      </h1>
                      <p className="text-base text-slate-600 leading-relaxed font-normal">
                        {bio || "Professional designer and engineer focusing on delivering high-quality web structures that combine design precision with technical stability."}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-3">
                        <a
                          href="#projects"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                        >
                          View Work <ArrowRight size={16} />
                        </a>
                        <a
                          href="#contact"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors"
                        >
                          Get in Touch
                        </a>
                      </div>
                    </div>

                    {profilePhoto ? (
                      <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-md bg-slate-100 shrink-0">
                        <img
                          src={profilePhoto}
                          alt={name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 text-slate-400">
                        <Layers size={48} />
                      </div>
                    )}
                  </div>
                </section>
              );

            case 'about':
              return (
                <section id="about" key="about" className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 shrink-0">About Profile</h2>
                    <div className="h-[2px] bg-slate-200 w-full" />
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 bg-white p-8 rounded-2xl border border-slate-200/60 space-y-4 text-slate-600 leading-relaxed">
                      <p>{bio || "No professional overview available."}</p>
                    </div>
                    <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl space-y-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h3 className="font-bold text-indigo-400 text-xs tracking-wider uppercase">Contact Channels</h3>
                        <div className="space-y-3 text-sm">
                          {location && (
                            <div className="flex items-center gap-3">
                              <MapPin size={16} className="text-slate-400" />
                              <span className="text-slate-300">{location}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-3">
                              <Mail size={16} className="text-slate-400" />
                              <a href={`mailto:${email}`} className="text-slate-300 hover:text-indigo-400 hover:underline">{email}</a>
                            </div>
                          )}
                          {phone && (
                            <div className="flex items-center gap-3">
                              <Phone size={16} className="text-slate-400" />
                              <span className="text-slate-300">{phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-800 flex gap-4 text-slate-400">
                        {renderSocials(18)}
                      </div>
                    </div>
                  </div>
                </section>
              );

            case 'skills':
              if (!skills || skills.length === 0) return null;
              return (
                <section id="skills" key="skills" className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 shrink-0">Competency Area</h2>
                    <div className="h-[2px] bg-slate-200 w-full" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {Object.entries(skillsByCategory).map(([category, items]) => (
                      <div key={category} className="bg-white p-6 rounded-2xl border border-slate-200/60 space-y-5 shadow-xs">
                        <h3 className="font-extrabold text-indigo-700 text-sm tracking-wide uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                          <Layers size={16} /> {category}
                        </h3>
                        <div className="space-y-4">
                          {items.map((skill, idx) => (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-700">{skill.name}</span>
                                <span className="text-indigo-600 font-bold">{skill.level}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${skill.level}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'projects':
              if (!projects || projects.length === 0) return null;
              return (
                <section id="projects" key="projects" className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 shrink-0">Featured Portfolio</h2>
                    <div className="h-[2px] bg-slate-200 w-full" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-2">
                    <p className="text-sm text-slate-500">
                      Explore case studies and active web software deployments.
                    </p>
                    {categories.length > 2 && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl transition-all font-semibold ${
                              selectedCategory === cat
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {sortedProjects.map((project) => (
                      <div
                        key={project.projectId}
                        className="group border border-slate-200/80 rounded-2xl bg-white hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
                      >
                        {project.imageUrl && (
                          <div className="h-52 overflow-hidden bg-slate-50 border-b border-slate-100 relative">
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                            />
                            <span className="absolute top-3 left-3 px-3 py-1 text-[10px] uppercase font-extrabold tracking-wider bg-slate-900 text-slate-100 rounded-md">
                              {project.category}
                            </span>
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-grow space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-extrabold text-lg text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-sm text-slate-600 font-light line-clamp-3 leading-relaxed">
                              {project.description}
                            </p>
                          </div>

                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {project.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 rounded-lg font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 pt-4 mt-auto text-sm border-t border-slate-100">
                            {project.demoUrl && (
                              <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                View Live <ExternalLink size={14} />
                              </a>
                            )}
                            {project.githubUrl && (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                              >
                                View Code <Github size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'contact':
              return (
                <section id="contact" key="contact" className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl relative overflow-hidden">
                  <div className="absolute left-0 bottom-0 w-64 h-64 bg-indigo-950 rounded-full filter blur-3xl -z-10 opacity-40" />
                  <div className="space-y-6 text-center max-w-xl mx-auto relative z-10">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Let's Build Something Together</h2>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                      I am always looking for exciting opportunities to design and engineer impactful web products. Get in touch directly.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <a
                        href={`mailto:${email}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-bold text-sm"
                      >
                        Send Direct Message <Mail size={16} />
                      </a>
                      <a
                        href={`tel:${phone}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-bold text-sm"
                      >
                        Call Contact <Phone size={16} />
                      </a>
                    </div>
                  </div>
                </section>
              );
            default:
              return null;
          }
        })}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 border-t border-slate-200/80 pt-10">
          <p>© {new Date().getFullYear()} {name}. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
