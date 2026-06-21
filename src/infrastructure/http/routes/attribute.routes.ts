import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { attributeController } from "../../dependencies";

import { validateSchema } from "../middlewares/validateSchema";
import { CreateAttributeSchema, UpdateAttributeSchema, AddSystemSchema } from "../schemas/attribute.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: MongoDB ID of the attribute.
 *         ruleset:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of system IDs or names associated.
 *         name:
 *           type: string
 *           description: Name of the attribute (e.g. Strength).
 *         description:
 *           type: string
 *           description: Detailed description.
 *         key:
 *           type: string
 *           description: Unique key identifier (e.g. str, dex).
 *         abbreviation:
 *           type: string
 *           description: Abbreviation (e.g. STR, DEX).
 *         icon:
 *           type: string
 *           description: Optional icon name or URL.
 *     InputCreateAttribute:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - key
 *         - abbreviation
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Initial system ID or name from which it's created.
 *         name:
 *           type: string
 *           description: Name of the attribute.
 *         description:
 *           type: string
 *           description: Description.
 *         key:
 *           type: string
 *           description: Unique identifier key.
 *         abbreviation:
 *           type: string
 *           description: Abbreviation.
 *         icon:
 *           type: string
 *           description: Optional icon name or URL.
 *     InputUpdateAttribute:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         key:
 *           type: string
 *         abbreviation:
 *           type: string
 *         icon:
 *           type: string
 */

/**
 * @openapi
 * /attributes:
 *   post:
 *     summary: Create a new attribute
 *     tags:
 *       - Attributes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateAttribute'
 *     responses:
 *       201:
 *         description: Attribute created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Missing required fields.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post('/attributes', authMiddleware, validateSchema(CreateAttributeSchema), attributeController.create);

/**
 * @openapi
 * /attributes/{id}:
 *   put:
 *     summary: Update an existing attribute
 *     tags:
 *       - Attributes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the attribute to edit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateAttribute'
 *     responses:
 *       200:
 *         description: Attribute modified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Missing attribute ID.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.put('/attributes/:id', authMiddleware, validateSchema(UpdateAttributeSchema), attributeController.update);

/**
 * @openapi
 * /attributes/{id}/systems:
 *   post:
 *     summary: Associate attribute to a system (via body)
 *     tags:
 *       - Attributes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemId
 *             properties:
 *               systemId:
 *                 type: string
 *                 description: System ID or name to add.
 *     responses:
 *       200:
 *         description: System associated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Missing required fields.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post('/attributes/:id/systems', authMiddleware, validateSchema(AddSystemSchema), attributeController.addSystem);

/**
 * @openapi
 * /attributes/{id}/systems/{systemId}:
 *   delete:
 *     summary: Unassociate attribute from a system (via URL)
 *     tags:
 *       - Attributes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID.
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *         description: System ID or name to remove.
 *     responses:
 *       200:
 *         description: System unassociated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Missing required parameters.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.delete('/attributes/:id/systems/:systemId', authMiddleware, attributeController.removeSystem);

export default router;
