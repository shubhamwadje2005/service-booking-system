import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export interface RequestValidators {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Reusable Zod request validator middleware.
 * Supports:
 * - validate(bodySchema): Validates req.body
 * - validate({ body, params, query }): Validates any combination of body, params, and query
 */
export const validate = (schema: ZodType | RequestValidators) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema instanceof ZodType) {
        req.body = await schema.parseAsync(req.body);
      } else {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.params) {
          const validatedParams = (await schema.params.parseAsync(req.params)) as Record<string, string>;
          Object.assign(req.params, validatedParams);
        }
        if (schema.query) {
          const validatedQuery = (await schema.query.parseAsync(req.query)) as Record<string, any>;
          Object.assign(req.query, validatedQuery);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const message = firstIssue ? `${firstIssue.message}` : "Validation failed";
        res.status(400).json({
          success: false,
          message,
          error: "Bad Request",
        });
        return;
      }
      next(error);
    }
  };
};
