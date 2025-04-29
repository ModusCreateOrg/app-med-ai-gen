import { IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router';
import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './TabNavigation.scss';
import AppMenu from '../Menu/AppMenu';
import SvgIcon from '../Icon/SvgIcon';
import UploadModal from '../Upload/UploadModal';
import HomePage from 'pages/Home/HomePage';
import UserDetailPage from 'pages/Users/components/UserDetail/UserDetailPage';
import UserListPage from 'pages/Users/components/UserList/UserListPage';
import UserEditPage from 'pages/Users/components/UserEdit/UserEditPage';
import AccountPage from 'pages/Account/AccountPage';
import ProfilePage from 'pages/Account/components/Profile/ProfilePage';
import DiagnosticsPage from 'pages/Account/components/Diagnostics/DiagnosticsPage';
import ChatPage from 'pages/Chat/ChatPage';
import UploadPage from 'pages/Upload/UploadPage';
import ReportsListPage from 'pages/Reports/ReportsListPage';
import ReportDetailPage from 'pages/Reports/ReportDetailPage';
import ProcessingPage from 'pages/Processing/ProcessingPage';

// Import SVG icons
import homeIcon from 'assets/icons/home.svg';
import reportsIcon from 'assets/icons/reports.svg';
import uploadIcon from 'assets/icons/upload.svg';
import chatIcon from 'assets/icons/chat.svg';
import profileIcon from 'assets/icons/profile.svg';

/**
 * The `TabNavigation` component provides a router outlet for all of the
 * application routes. The component renders two main application
 * navigation controls.
 *
 * On smaller viewport sizes, Ionic mobile tab navigation is rendered at
 * the bottom of the page.
 *
 * On larger viewport sizes, the Ionic [side] menu is rendered. The menu
 * may be toggled using the hamburger (three lines) icon in the top
 * toolbar.
 *
 * @returns JSX
 * @see {@link AppMenu}
 */
const TabNavigation = (): JSX.Element => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  // Check if the current path starts with the tab path
  const isTabActive = (tabPath: string) => {
    return location.pathname.startsWith(tabPath);
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    // Close the modal
    setIsUploadModalOpen(false);

    // Navigate to home page to see the newly uploaded report
    history.push('/tabs/home');
  };

  return (
    <>
      <AppMenu />

      <IonTabs className="ls-tab-navigation">
        <IonRouterOutlet id="content-main">
          <Redirect exact path="/tabs" to="/tabs/home" />
          <Route exact path="/tabs/home">
            <HomePage />
          </Route>
          <Route exact path="/tabs/users">
            <UserListPage />
          </Route>
          <Route exact path="/tabs/users/:userId">
            <UserDetailPage />
          </Route>
          <Route exact path="/tabs/users/:userId/edit">
            <UserEditPage />
          </Route>
          <Route exact path="/tabs/account">
            <AccountPage />
          </Route>
          <Route exact path="/tabs/account/profile">
            <ProfilePage />
          </Route>
          <Route exact path="/tabs/account/diagnostics">
            <DiagnosticsPage />
          </Route>
          <Route exact path="/tabs/chat">
            <ChatPage />
          </Route>
          <Route exact path="/tabs/upload">
            <UploadPage />
          </Route>
          <Route exact path="/tabs/reports">
            <ReportsListPage />
          </Route>
          <Route exact path="/tabs/reports/:reportId">
            <ReportDetailPage />
          </Route>
          <Route exact path="/tabs/processing">
            <ProcessingPage />
          </Route>
          <Route exact path="/">
            <Redirect to="/tabs/home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom" className="ls-tab-navigation__bar ion-hide-md-up">
          <IonTabButton className="ls-tab-navigation__bar-button" tab="home" href="/tabs/home">
            <SvgIcon
              className="ls-tab-navigation__bar-button-icon"
              src={homeIcon}
              active={isTabActive('/tabs/home')}
              alt={t('navigation.home', { ns: 'common', defaultValue: 'Home' })}
              width={24}
              height={24}
            />
          </IonTabButton>
          <IonTabButton
            className="ls-tab-navigation__bar-button"
            tab="reports"
            href="/tabs/reports"
          >
            <SvgIcon
              className="ls-tab-navigation__bar-button-icon"
              src={reportsIcon}
              active={isTabActive('/tabs/reports')}
              alt={t('navigation.reports', { ns: 'common', defaultValue: 'Reports' })}
              width={24}
              height={24}
            />
          </IonTabButton>
          <IonTabButton
            className="ls-tab-navigation__bar-button ls-tab-navigation__bar-button--upload"
            tab="upload"
            onClick={handleUploadClick}
          >
            <div className="ls-tab-navigation__bar-button-upload-wrapper">
              <SvgIcon
                className="ls-tab-navigation__bar-button-icon"
                src={uploadIcon}
                alt={t('navigation.upload', { ns: 'common', defaultValue: 'Upload' })}
                width={24}
                height={24}
              />
            </div>
          </IonTabButton>
          <IonTabButton className="ls-tab-navigation__bar-button" tab="chat" href="/tabs/chat">
            <SvgIcon
              className="ls-tab-navigation__bar-button-icon"
              src={chatIcon}
              active={isTabActive('/tabs/chat')}
              alt={t('navigation.chat', { ns: 'common', defaultValue: 'Chat' })}
              width={24}
              height={24}
            />
          </IonTabButton>
          <IonTabButton
            className="ls-tab-navigation__bar-button"
            tab="account"
            href="/tabs/account"
          >
            <SvgIcon
              className="ls-tab-navigation__bar-button-icon"
              src={profileIcon}
              active={isTabActive('/tabs/account')}
              alt={t('navigation.account', { ns: 'common', defaultValue: 'Account' })}
              width={24}
              height={24}
            />
          </IonTabButton>
        </IonTabBar>
      </IonTabs>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
};

export default TabNavigation;
