class Api {
  constructor(config) {
    this._baseUrl = config.baseUrl;
    this._header = config.headers;
  }

  getUserInfo() {
    return this._request(this._baseUrl + 'users/me', { headers: this._header })
  }

  editProfile({ name, about}) {
    return this._request(this._baseUrl + 'users/me', {
      method: 'PATCH',
      headers: this._header,
      body: JSON.stringify( { name, about }),
    })
  }

  changeAvatar({ avatar }) {
    return this._request(this._baseUrl + 'users/me/avatar', {
      method: 'PATCH',
      headers: this._header,
      body: JSON.stringify( { avatar }),
    })
  }

  getInitialsCards() {
    return this._request(this._baseUrl + 'cards', { headers: this._header })
  }

  addCard({ name, link }) {
    return this._request(this._baseUrl + 'cards', {
      method: 'POST',
      headers: this._header,
      body: JSON.stringify( { name, link }),
    })
  }

  changeLikeCardStatus(cardId, isLiked) {
    let method = 'PUT';
    if (!isLiked) {
      method = 'DELETE';
    }

    return this._request(this._baseUrl + 'cards/' + cardId + '/likes', {
      method: method,
      headers: this._header,
    })
  }

  deleteCard(cardId) {
    return this._request(this._baseUrl + 'cards/' + cardId, {
      method: 'DELETE',
      headers: this._header,
    })
  }

  _request(url, options) {
    const jwt = localStorage.getItem('jwt');
    options.headers.Authorization = "Bearer " + jwt;

    return fetch(url, options).then(this._checkResponse);
  }

  _checkResponse(response) {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(new Error(response.status));
  }
}

const api = new Api({
  baseUrl: 'https://api.mesto.marias.nomoredomains.work/',
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;

