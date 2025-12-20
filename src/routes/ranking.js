const express = require('express');
const router = express.Router();
const { getStudentsRanking, getTeachersRanking, getParentsRanking } = require('../controllers/rankingController');

// GET /api/ranking/students - Ranking de estudiantes
router.get('/students', getStudentsRanking);

// GET /api/ranking/teachers - Ranking de docentes
router.get('/teachers', getTeachersRanking);

// GET /api/ranking/parents - Ranking de padres
router.get('/parents', getParentsRanking);

module.exports = router;

