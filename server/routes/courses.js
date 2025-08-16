const express = require('express');
const router = express.Router();
const { isProfessorOrHigher, isInstitutionAdminOrHigher, ensureCourseOwnership } = require('../middleware/auth');
const {
    getCourses,
    createCourse,
    deleteCourse,
    updateCourse,
    assignProfessor,
    createProfessor,
    removeProfessor
} = require('../controllers/courseController');

// @desc    Get courses for an institution
// @route   GET /api/courses
router.get('/', isProfessorOrHigher, getCourses);

// @desc    Create a new course
// @route   POST /api/courses
router.post('/', isInstitutionAdminOrHigher, createCourse);

// @desc    Delete a course
// @route   DELETE /api/courses/:id
router.delete('/:id', isInstitutionAdminOrHigher, ensureCourseOwnership, deleteCourse);

// @desc    Update a course name
// @route   PUT /api/courses/:id
router.put('/:id', isInstitutionAdminOrHigher, ensureCourseOwnership, updateCourse);

// @desc    Assign a professor to a course
// @route   PUT /api/courses/:id/assign-professor
router.put('/:id/assign-professor', isInstitutionAdminOrHigher, ensureCourseOwnership, assignProfessor);

// @desc    Create a new professor and assign them to a course
// @route   POST /api/courses/:id/professors
router.post('/:id/professors', isInstitutionAdminOrHigher, ensureCourseOwnership, createProfessor);

// @desc    Remove a professor from a course
// @route   DELETE /api/courses/:courseId/professors/:professorId
router.delete('/:courseId/professors/:professorId', isInstitutionAdminOrHigher, ensureCourseOwnership, removeProfessor);

module.exports = router;
