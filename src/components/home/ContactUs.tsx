import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';

// Section 6: Contact Us
export const ContactUs = () => (
    <section className="py-24 px-4 bg-[#0B0E11]/30" id="contact">
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
        >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Contact Us</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-12">Need help or have questions? Our support team is ready to assist you.</p>
            
            <div className="bg-[#161A1E] border border-[#2B3139] p-8 rounded-2xl inline-block shadow-lg hover:border-amber-500/30 transition-all">
                <Mail className="w-12 h-12 text-amber-500 mx-auto mb-6 animate-pulse" />
                <h3 className="font-bold text-xl text-white mb-2">Email Support</h3>
                <a href="mailto:support@orbitriotrades.com" className="text-amber-500 hover:text-amber-400 text-lg transition-colors hover:underline">support@orbitriotrades.com</a>
                <p className="text-neutral-500 mt-6">24 Hours / 7 Days</p>
            </div>
        </motion.div>
    </section>
);

// Footer