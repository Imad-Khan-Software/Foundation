import { Link } from "react-router-dom";
import { foundation } from "../data/sampleData";
import ThreadDivider from "./ThreadDivider";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-pine-dark text-paper/90 mt-24">
      <ThreadDivider className="opacity-80" />
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <BrandLogo className="h-9 w-9 bg-paper text-pine-dark text-base" />
            <span className="font-display text-lg text-paper">
              {foundation.shortName}
            </span>
          </div>
          <p className="text-sm text-paper/70 leading-relaxed">
            {foundation.tagline}
          </p>
        </div>

        <div>
          <p className="eyebrow text-paper/60 mb-1">Explore</p>
          <ul className="text-sm">
            <li><Link to="/about" className="block py-2.5 hover:text-education-light">About the foundation</Link></li>
            <li><Link to="/projects" className="block py-2.5 hover:text-education-light">Our projects</Link></li>
            <li><Link to="/activities" className="block py-2.5 hover:text-education-light">Activities</Link></li>
            <li><Link to="/transparency" className="block py-2.5 hover:text-education-light">Financial transparency</Link></li>
            <li><Link to="/gallery" className="block py-2.5 hover:text-education-light">Gallery</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/60 mb-1">Get involved</p>
          <ul className="text-sm">
            <li><Link to="/donate" className="block py-2.5 hover:text-education-light">Donate</Link></li>
            <li><Link to="/branches" className="block py-2.5 hover:text-education-light">Our branches</Link></li>
            <li><Link to="/team" className="block py-2.5 hover:text-education-light">Our team</Link></li>
            <li><Link to="/contact" className="block py-2.5 hover:text-education-light">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-paper/60 mb-1">Contact</p>
          <ul className="space-y-2 text-sm text-paper/80 break-words">
            <li>{foundation.phone}</li>
            <li className="break-all">{foundation.email}</li>
            <li>{foundation.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-5 text-xs text-paper/50 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} {foundation.name}. All rights reserved.</span>
          <span>Every figure on this site reflects verified records only.</span>
        </div>
      </div>
    </footer>
  );
}
