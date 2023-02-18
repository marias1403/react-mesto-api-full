import React, {useEffect, useState} from 'react';
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import ImagePopup from './ImagePopup';
import api from '../utils/api';
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import {Route, Switch, useHistory} from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";
import * as auth from '../utils/auth.js';
import card from "./Card";

function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] = useState(false);
  const [isInfoTooltipPopupSuccess, setIsInfoTooltipPopupSuccess] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (isLoggedIn) {
      api.getInitialsCards()
        .then(res => res.data)
        .then(data => {
          setCards(data.map((cardData) => {
            const likes = [];
            for (let like of cardData.likes) {
              likes.push(like._id);
            }

            return mapCardDataToState(cardData, likes, cardData.owner._id);
          }))
        })
        .catch((err) => {
          console.log(err);
        })
    }
  }, [isLoggedIn])

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      auth.getUserData(jwt)
        .then((userData) => {
          if (userData) {
            setIsLoggedIn(true);
            history.push('/');
            setUserData(userData);
          } else {
            setIsLoggedIn(false);
          }
        })
        .catch((err) => {
          console.log(err);
        })
    }
  }, [isLoggedIn])

  function handleCardLike(card) {
    const isLiked = card.likes.some(i => i === currentUser._id);
    api.changeLikeCardStatus(card.idCard, !isLiked).then(res => res.data).then((newCard) => {
      setCards((state) => state.map((c) => c.idCard === card.idCard ? mapCardDataToState(newCard, newCard.likes, newCard.owner) : c));
    })
      .catch((err) => {
        console.log(err);
      })
  }

  function handleCardDelete(card) {
    const isOwn = card.owner === currentUser._id;
    api.deleteCard(card.idCard, isOwn).then(() => {
      setCards((state) => state.filter((c) => c.idCard !== card.idCard));
    })
      .catch((err) => {
        console.log(err);
      })
  }

  function mapCardDataToState(card, likes, owner) {
    return {
      idCard: card._id,
      image: card.link,
      title: card.name,
      likes,
      owner,
    }
  }

  function handleAddPlaceSubmit({ name, link }) {
    api.addCard({ name: name, link: link })
      .then(res => res.data)
      .then((newCard) => {
        const likes = [];
        for (let like of newCard.likes) {
          likes.push(like._id);
        }

        setCards([mapCardDataToState(newCard, likes, newCard.owner), ...cards]);
        closeAllPopups();
    })
      .catch((err) => {
        console.log(err);
      })
  }

  useEffect(() => {
    if (isLoggedIn) {
      api.getUserInfo()
        .then(res => res.data)
        .then(user => setCurrentUser(user))
        .catch((err) => {
          console.log(err);
        })
    }
  }, [isLoggedIn])

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleAuthResult(isSuccess) {
    setIsInfoTooltipPopupSuccess(isSuccess);
    setIsInfoTooltipPopupOpen(true);
  }

  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsInfoTooltipPopupOpen(false);
    setSelectedCard(null);
  }

  function handleUpdateUser({ name, about }) {
    api.editProfile({ name, about })
      .then(res => res.data)
      .then((user) => {
        setCurrentUser(user);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      })
  }

  function handleUpdateAvatar({ avatar }) {
    api.changeAvatar({ avatar: avatar })
      .then(res => res.data)
      .then((user) => {
        setCurrentUser(user);
        closeAllPopups();
    })
      .catch((err) => {
        console.log(err);
      })
  }

  function handleRegister(email, password) {
    auth.register(email, password)
      .then((res) => {
        if(res) {
          handleAuthResult(true);
          history.push("/sign-in")
        } else {
          handleAuthResult(false);
        }
      })
      .catch((err) => {
        console.log(err);
        handleAuthResult(false);
      })
  }

  function handleLogin(email, password) {
    if (!email || !password){
      return;
    }
    auth.authorize(email, password)
      .then((res) => {
        if(res.token) {
          localStorage.setItem('jwt', res.token);
          handleGetUserData(res.token);
          history.push("/")
        } else {
          handleAuthResult(false);
        }
      })
      .catch((err) => {
        console.log(err);
        handleAuthResult(false);
      });
  }

  function handleGetUserData(token) {
    setIsLoggedIn(true);
    auth.getUserData(token)
      .then((userData) => {
        setUserData(userData);
      })
  }

  return (
    <CurrentUserContext.Provider value={ currentUser }>
      <div className="page">
        <div className="page__container">
          <Header
            userData={userData}
          />
          <Switch>
            <Route path="/sign-in">
              <Login
                onLogin={handleLogin}
              />
            </Route>
            <Route path="/sign-up">
              <Register
                onRegister={handleRegister}
              />
            </Route>
            <ProtectedRoute
              path="/"
              loggedIn={isLoggedIn}
              component={Main}
              childProps={{
                "cards": cards,
                "onCardLike": handleCardLike,
                "onCardDelete": handleCardDelete,
                "onEditProfile": handleEditProfileClick,
                "onAddPlace": handleAddPlaceClick,
                "onEditAvatar": handleEditAvatarClick,
                "onCardClick": handleCardClick
              }}
            />
          </Switch>
          <Footer />
        </div>
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />
        <ImagePopup
          card={selectedCard}
          onClose={closeAllPopups}
        />
        <InfoTooltip
          isOpen={isInfoTooltipPopupOpen}
          onClose={closeAllPopups}
          isSuccess={isInfoTooltipPopupSuccess}
          successText={"Успешная регистрация"}
          failText={"Регистрация не прошла"}
        />
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
