import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThumbTack,
  faArrowRightFromBracket,
  faRightToBracket,
  faCircleUser,
  faExpand,
  faCompress,
  faUpRightAndDownLeftFromCenter,
  faDownLeftAndUpRightToCenter,
} from '@fortawesome/free-solid-svg-icons';
import './TopNavbar.css';
import logo from '../assets/FRVtubers_Vart.png';

const TopNavbar = ({
  onLoginClick,
  onLogout,
  onTogglePins,
  isAuthenticated,
  pinCount,
  onToggleFitMode,
  onToggleFullscreen,
  fitMode = 'cover',
  fullscreenActive = false,
  mediaAvailable = false,
}) => {
  const fitIsContain = fitMode === 'contain';
  const handleFitClick = () => {
    if (!mediaAvailable) {
      return;
    }
    if (typeof onToggleFitMode === 'function') {
      onToggleFitMode();
    }
  };
  const handleFullscreenClick = () => {
    if (!mediaAvailable) {
      return;
    }
    if (typeof onToggleFullscreen === 'function') {
      onToggleFullscreen();
    }
  };

  return (
    <div className="top-navbar">
      <div className="top-brand">
        {/* <img src={logo} alt="FRVArt" /> */}
        {!isAuthenticated && <div>
          <span className="brand-title">FRVArt</span>
          <span className="brand-subtitle">Art du VTubing Francophone sur bluesky</span>
        </div>}
      </div>
      <div className="top-actions">
        {isAuthenticated ? (
          <>
            <button
              type="button"
              className={`top-btn media ${fitIsContain ? 'active' : ''}`}
              onClick={handleFitClick}
              disabled={!mediaAvailable}
              aria-pressed={fitIsContain}
              aria-label={
                fitIsContain
                  ? "Repasser l'illustration en mode couverture"
                  : "Adapter l'illustration au cadre"
              }
              title={fitIsContain ? 'Remplir' : 'Adapter'}
              data-prevent-desktop-swipe="true"
            >
              <FontAwesomeIcon icon={fitIsContain ? faExpand : faCompress} />
            </button>
            <button
              type="button"
              className={`top-btn fullscreen ${fullscreenActive ? 'active' : ''}`}
              onClick={handleFullscreenClick}
              disabled={!mediaAvailable}
              aria-pressed={fullscreenActive}
              aria-haspopup="dialog"
              aria-label={
                fullscreenActive
                  ? 'Fermer la visionneuse plein ecran'
                  : 'Ouvrir la visionneuse plein ecran'
              }
              title={fullscreenActive ? 'Fermer la visionneuse' : 'Visionneuse plein ecran'}
              data-prevent-desktop-swipe="true"
            >
              <FontAwesomeIcon
                icon={
                  fullscreenActive ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter
                }
              />
            </button>
          </>
        ) : null}
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
