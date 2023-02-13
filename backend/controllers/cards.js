const http2 = require('node:http2');
const Card = require('../models/card');
const NotFoundError = require('../errors/not-found-error');
const BadRequestError = require('../errors/bad-request-error');
const ForbiddenError = require('../errors/forbidden-error');

const getCards = (req, res, next) => Card.find({})
  .populate(['owner', 'likes'])
  .then((cards) => res.send({ data: cards }))
  .catch(next);

const createCard = (req, res, next) => Card.create({
  name: req.body.name,
  link: req.body.link,
  owner: req.user._id,
})
  .then((card) => res.status(http2.constants.HTTP_STATUS_CREATED).send({ data: card }))
  .catch((err) => {
    if (err.name === 'ValidationError') {
      next(new BadRequestError('Переданы некорректные данные при создании карточки'));
    } else {
      next(err);
    }
  });

const deleteCard = (req, res, next) => Card.findById(req.params.cardId)
  .then((card) => {
    if (card === null) {
      throw new NotFoundError('Карточка с указанным _id не найдена');
    }

    if (card.owner._id.toString() === req.user._id) {
      return Card.findOneAndRemove(req.params.cardId);
    }

    throw new ForbiddenError('Нет прав на удаления карточки');
  })
  .then((card) => res.status(http2.constants.HTTP_STATUS_OK).send({ data: card }))
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new BadRequestError('Переданы некорректные данные при удалении карточки'));
    } else {
      next(err);
    }
  });

const likeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $addToSet: { likes: req.user._id } },
  { new: true },
)
  .then((card) => {
    if (card === null) {
      throw new NotFoundError('Передан несуществующий _id карточки');
    }
    return res.status(http2.constants.HTTP_STATUS_OK).send({ data: card });
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new BadRequestError('Переданы некорректные данные'));
    } else {
      next(err);
    }
  });

const dislikeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  { $pull: { likes: req.user._id } },
  { new: true },
)
  .then((card) => {
    if (card === null) {
      throw new NotFoundError('Передан несуществующий _id карточки');
    }
    return res.status(http2.constants.HTTP_STATUS_OK).send({ data: card });
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new BadRequestError('Переданы некорректные данные'));
    } else {
      next(err);
    }
  });

module.exports = {
  getCards, createCard, deleteCard, likeCard, dislikeCard,
};
