import { IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import './TabNavigation.scss';
import AppMenu from '../Menu/AppMenu';
import Icon from '../Icon/Icon';
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
          <Route exact path="/">
            <Redirect to="/tabs/home" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom" className="ls-tab-navigation__bar ion-hide-md-up">
          <IonTabButton className="ls-tab-navigation__bar-button" tab="home" href="/tabs/home">
            <Icon
              className="ls-tab-navigation__bar-button-icon"
              icon="home"
              size="xl"
              fixedWidth
            />
          </IonTabButton>
          <IonTabButton className="ls-tab-navigation__bar-button" tab="analytics" href="/tabs/analytics">
            <Icon
              className="ls-tab-navigation__bar-button-icon"
              icon="fileLines"
              iconStyle="regular"
              size="xl"
              fixedWidth
            />
          </IonTabButton>
          <IonTabButton 
            className="ls-tab-navigation__bar-button ls-tab-navigation__bar-button--upload" 
            tab="upload" 
            onClick={handleUploadClick}
          >
            <div className="ls-tab-navigation__bar-button-upload-wrapper">
              <Icon
                className="ls-tab-navigation__bar-button-icon"
                icon="arrowUpFromBracket"
                size="xl"
                fixedWidth
              />
            </div>
          </IonTabButton>
          <IonTabButton className="ls-tab-navigation__bar-button" tab="chat" href="/tabs/chat">
            <Icon
              className="ls-tab-navigation__bar-button-icon"
              icon="comment"
              iconStyle="regular"
              size="xl"
              fixedWidth
            />
          </IonTabButton>
          <IonTabButton
            className="ls-tab-navigation__bar-button"
            tab="account"
            href="/tabs/account"
          >
            <Icon
              className="ls-tab-navigation__bar-button-icon"
              icon="userCircle"
              size="xl"
              fixedWidth
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
