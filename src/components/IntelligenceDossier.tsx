import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Image,
  Briefcase,
  GraduationCap,
  Flag,
  Calendar,
  ExternalLink,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { TargetProfile } from '../types';

interface IntelligenceDossierProps {
  profile: TargetProfile | null;
  isVisible: boolean;
}

export function IntelligenceDossier({ profile, isVisible }: IntelligenceDossierProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!profile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className="h-full overflow-y-auto backdrop-blur-xl bg-slate-900/60 border-l border-slate-700/50"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Target Intelligence Dossier</h2>
                <p className="text-xs text-slate-400">Consolidated identity profile</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Face Verification Container */}
            <div className="relative backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Image className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm font-medium text-white">Face Verification</p>
                </div>

                {/* Image Carousel */}
                <div className="relative">
                  <div className="flex gap-3 overflow-hidden">
                    {profile.images.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative flex-shrink-0 ${
                          idx === currentImageIndex ? 'w-32 h-32' : 'w-24 h-24 opacity-60'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Profile ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl border border-slate-600/50"
                        />
                        {img.isPrimary && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/50">
                            <span className="text-[8px] text-cyan-400 font-medium">PRIMARY</span>
                          </div>
                        )}
                        {/* Confidence Overlay */}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm">
                          <span className="text-[9px] text-emerald-400 font-medium">
                            {(img.confidence * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Carousel Controls */}
                  {profile.images.length > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-300" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentImageIndex(Math.min(profile.images.length - 1, currentImageIndex + 1))
                        }
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-900/80 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    </>
                  )}
                </div>

                {/* Match Score */}
                {profile.images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300">
                      <span className="text-emerald-400 font-semibold">
                        {Math.round(profile.images[0].confidence * 100)}%
                      </span>{' '}
                      confidence via FaceNet
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Identity */}
            <div className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-violet-400" />
                <p className="text-sm font-medium text-white">Primary Identity</p>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <p className="text-lg font-semibold text-white">{profile.primaryName}</p>
                  <p className="text-xs text-slate-400 mt-1">Primary Legal Name</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.aliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-300"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Demographics */}
            {profile.demographics && (
              <div className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-medium text-white">Demographics</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {profile.demographics.age && (
                    <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase">Age</p>
                      <p className="text-sm text-white font-medium">{profile.demographics.age}</p>
                    </div>
                  )}
                  {profile.demographics.gender && (
                    <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase">Gender</p>
                      <p className="text-sm text-white font-medium">{profile.demographics.gender}</p>
                    </div>
                  )}
                  {profile.demographics.nationality && (
                    <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase">Nationality</p>
                      <p className="text-sm text-white font-medium">{profile.demographics.nationality}</p>
                    </div>
                  )}
                  {profile.demographics.occupation && (
                    <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <p className="text-[10px] text-slate-500 uppercase">Occupation</p>
                      </div>
                      <p className="text-xs text-white font-medium">{profile.demographics.occupation}</p>
                    </div>
                  )}
                </div>
                {profile.demographics.education && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                    <div className="flex items-center gap-1 mb-1">
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      <p className="text-[10px] text-slate-500 uppercase">Education</p>
                    </div>
                    <p className="text-xs text-white">{profile.demographics.education}</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Information */}
            <div className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-medium text-white">Contact Intelligence</p>
              </div>

              {/* Emails */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Email Addresses</p>
                {profile.emails.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-1"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-300">{email}</span>
                  </div>
                ))}
              </div>

              {/* Phones */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Phone Numbers</p>
                {profile.phones.map((phone, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-300">{phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Profiles */}
            <div className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-rose-400" />
                <p className="text-sm font-medium text-white">Digital Footprint</p>
              </div>
              <div className="space-y-2">
                {profile.socialProfiles.map((social, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-500/20">
                        <Globe className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{social.platform}</p>
                        <p className="text-[10px] text-slate-400">@{social.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {social.followers && (
                        <span className="text-[10px] text-rose-400">
                          {social.followers.toLocaleString()} followers
                        </span>
                      )}
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Location History */}
            <div className="backdrop-blur-xl bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-teal-400" />
                <p className="text-sm font-medium text-white">Location History</p>
              </div>
              <div className="space-y-2">
                {profile.locations.map((location, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border ${
                      location.type === 'current'
                        ? 'bg-teal-500/20 border-teal-500/50'
                        : 'bg-slate-800/50 border-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        <div>
                          <p className="text-xs text-white font-medium">
                            {location.city}, {location.country}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">{location.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Confidence</p>
                        <p className="text-xs text-teal-400 font-medium">
                          {(location.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credential Flags */}
            {profile.credentials.length > 0 && (
              <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-medium text-red-400">Exposed Credentials</p>
                </div>
                <div className="space-y-2">
                  {profile.credentials.map((cred, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white">{cred.email}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Breach: {cred.breach}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] text-red-300">{cred.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
