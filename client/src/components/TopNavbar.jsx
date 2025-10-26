import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThumbTack,
  faArrowRightFromBracket,
  faRightToBracket,
  faCircleUser,
} from '@fortawesome/free-solid-svg-icons';
import './TopNavbar.css';
import logo from '../assets/FRVtubers_Vart.png';

const TopNavbar = ({
  onLoginClick,
  onLogout,
  onTogglePins,
  isAuthenticated,
  pinCount,
}) => {
  return (
    <div className="top-navbar">
      <div className="top-brand">
        {/* <img src={logo} alt="FRVArt" /> */}
        <div>
          <span className="brand-title">FRVArt</span>
          <span className="brand-subtitle">Art du VTubing Francophone sur bluesky</span>
        </div>
      </div>
      <div className="top-actions">
        <button
          type="button"
          className="top-btn"
          onClick={onTogglePins}
          aria-label="Afficher mes oeuvres épinglées"
        >
          <FontAwesomeIcon icon={faThumbTack} />
          {pinCount ? <span className="badge">{pinCount}</span> : null}
        </button>
        {isAuthenticated ? (
          <button
            type="button"
            className="top-btn logout"
            onClick={onLogout}
            aria-label="Se déconnecter"
          >
            <FontAwesomeIcon icon={faCircleUser} />
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </button>
        ) : (
          <button
            type="button"
            className="top-btn login"
            onClick={onLoginClick}
            aria-label="Se connecter"
          >
            <FontAwesomeIcon icon={faRightToBracket} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TopNavbar;
