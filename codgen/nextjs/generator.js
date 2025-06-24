'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.NextJsGenerator = void 0;
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var pluralize_1 = require('pluralize');
/**
 * Generator for Next.js components based on JHipster entity definitions
 */
var NextJsGenerator = /** @class */ (function () {
  function NextJsGenerator(projectRoot, jhipsterDir, templateDir, outputDir) {
    this.projectRoot = projectRoot;
    this.jhipsterDir = jhipsterDir;
    this.templateDir = templateDir;
    this.outputDir = outputDir;
  }
  /**
   * Generate CRUD components for all entities
   */
  NextJsGenerator.prototype.generateAll = function () {
    return __awaiter(this, void 0, void 0, function () {
      var entityFiles, _i, entityFiles_1, entityFile, entityName;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            entityFiles = fs.readdirSync(this.jhipsterDir).filter(function (file) {
              return file.endsWith('.json');
            });
            console.log(
              'Found '
                .concat(entityFiles.length, ' entity definitions in ')
                .concat(this.jhipsterDir)
            );
            (_i = 0), (entityFiles_1 = entityFiles);
            _a.label = 1;
          case 1:
            if (!(_i < entityFiles_1.length)) return [3 /*break*/, 4];
            entityFile = entityFiles_1[_i];
            entityName = entityFile.replace('.json', '');
            return [4 /*yield*/, this.generateEntity(entityName)];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            _i++;
            return [3 /*break*/, 1];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Generate CRUD components for a specific entity
   */
  NextJsGenerator.prototype.generateEntity = function (entityName) {
    return __awaiter(this, void 0, void 0, function () {
      var entityDefinitionPath, entityDefinition, vars, entityDir;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            console.log('Generating components for entity: '.concat(entityName));
            entityDefinitionPath = path.join(this.jhipsterDir, ''.concat(entityName, '.json'));
            console.log('Reading entity definition from: '.concat(entityDefinitionPath));
            entityDefinition = JSON.parse(fs.readFileSync(entityDefinitionPath, 'utf8'));
            vars = this.prepareTemplateVariables(entityName, entityDefinition);
            entityDir = path.join(this.outputDir, 'app', '(protected)/(features)', vars.routePath);
            console.log('Creating directories at: '.concat(entityDir));
            this.ensureDir(entityDir);
            this.ensureDir(path.join(entityDir, 'new'));
            this.ensureDir(path.join(entityDir, '[id]'));
            this.ensureDir(path.join(entityDir, '[id]', 'edit'));
            this.ensureDir(path.join(entityDir, 'components'));
            // Generate files from templates
            console.log('Generating component files...');
            return [
              4 /*yield*/,
              this.generateFile('entity/page.tsx.ejs', path.join(entityDir, 'page.tsx'), vars),
            ];
          case 1:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/new/page.tsx.ejs',
                path.join(entityDir, 'new', 'page.tsx'),
                vars
              ),
            ];
          case 2:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/[id]/page.tsx.ejs',
                path.join(entityDir, '[id]', 'page.tsx'),
                vars
              ),
            ];
          case 3:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/[id]/edit/page.tsx.ejs',
                path.join(entityDir, '[id]', 'edit', 'page.tsx'),
                vars
              ),
            ];
          case 4:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/components/entity-table.tsx.ejs',
                path.join(entityDir, 'components', ''.concat(vars.entityFileName, '-table.tsx')),
                vars
              ),
            ];
          case 5:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/components/entity-form.tsx.ejs',
                path.join(entityDir, 'components', ''.concat(vars.entityFileName, '-form.tsx')),
                vars
              ),
            ];
          case 6:
            _a.sent();
            return [
              4 /*yield*/,
              this.generateFile(
                'entity/components/entity-details.tsx.ejs',
                path.join(entityDir, 'components', ''.concat(vars.entityFileName, '-details.tsx')),
                vars
              ),
            ];
          case 7:
            _a.sent();
            console.log('Successfully generated components for '.concat(entityName));
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Prepare variables for EJS templates
   */
  NextJsGenerator.prototype.prepareTemplateVariables = function (entityName, entityDefinition) {
    var entityFileName = this.camelToKebab(entityName);
    var entityClass = entityName;
    var entityClassPlural = (0, pluralize_1.plural)(entityName);
    var entityInstance = this.lowerFirstCamelCase(entityName);
    var pluralizedRoute = (0, pluralize_1.plural)(entityFileName);
    // Process relationships to add computed properties
    var processedRelationships = this.processRelationships(entityDefinition.relationships || []);
    var persistableRelationships = processedRelationships.filter(function (r) {
      return r.relationshipType !== 'one-to-many';
    });
    // Get unique other entities for API imports
    var otherEntitiesWithPersistableRelationship =
      this.getUniqueOtherEntities(persistableRelationships);
    return {
      entityName: entityName,
      entityFileName: entityFileName,
      entityClass: entityClass,
      entityClassPlural: entityClassPlural,
      entityClassHumanized: this.humanize(entityClass),
      entityClassPluralHumanized: this.humanize(entityClassPlural),
      entityInstance: this.lowerFirstCamelCase(entityInstance),
      entityRoute: pluralizedRoute,
      routePath: pluralizedRoute,
      primaryKey: { name: 'id', type: 'number' },
      fields: entityDefinition.fields,
      relationships: processedRelationships,
      persistableRelationships: persistableRelationships,
      otherEntitiesWithPersistableRelationship: otherEntitiesWithPersistableRelationship,
      searchEngineAny: entityDefinition.searchEngine,
      anyFieldIsDateDerived: entityDefinition.fields.some(function (f) {
        return (
          f.fieldTypeTimed || f.fieldTypeLocalDate || f.fieldTypeZonedDateTime || f.fieldTypeInstant
        );
      }),
      anyFieldIsBlobDerived: entityDefinition.fields.some(function (f) {
        return f.fieldTypeBinary;
      }),
      readOnly: entityDefinition.readOnly || false,
      pagination: entityDefinition.pagination || 'no',
      service: entityDefinition.service || 'no',
      dto: entityDefinition.dto || 'no',
    };
  };
  /**
   * Generate a file from a template
   */
  NextJsGenerator.prototype.generateFile = function (templatePath, outputPath, variables) {
    return __awaiter(this, void 0, void 0, function () {
      var fullTemplatePath, template, output;
      return __generator(this, function (_a) {
        fullTemplatePath = path.join(this.templateDir, templatePath);
        if (!fs.existsSync(fullTemplatePath)) {
          console.error('Template file not found: '.concat(fullTemplatePath));
          return [2 /*return*/];
        }
        template = fs.readFileSync(fullTemplatePath, 'utf8');
        try {
          output = ejs.render(template, variables, {
            escape: function (str) {
              return str;
            }, // Don't escape output
          });
          fs.writeFileSync(outputPath, output);
          console.log('Generated: '.concat(outputPath));
        } catch (error) {
          console.error('Error generating file '.concat(outputPath, ':'), error);
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Create directory if it doesn't exist
   */
  NextJsGenerator.prototype.ensureDir = function (dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };
  /**
   * Process relationships to add computed properties
   */
  NextJsGenerator.prototype.processRelationships = function (relationships) {
    var _this = this;
    return relationships.map(function (rel) {
      var otherEntityName = rel.otherEntityName;
      var otherEntityClass = _this.upperFirstCamelCase(otherEntityName);
      var otherEntityClassPlural = (0, pluralize_1.plural)(otherEntityClass);
      var otherEntityInstance = _this.lowerFirstCamelCase(otherEntityName);
      var otherEntityInstancePlural = (0, pluralize_1.plural)(otherEntityInstance);
      var otherEntityFileName = _this.camelToKebab(otherEntityName);
      // Determine relationship field names
      var relationshipName = rel.relationshipName;
      var relationshipFieldName = relationshipName;
      var relationshipFieldNamePlural = (0, pluralize_1.plural)(relationshipName);
      // Determine if this is a collection relationship
      var isCollection =
        rel.relationshipType === 'one-to-many' || rel.relationshipType === 'many-to-many';
      // Determine display field - default to 'name' if not specified
      var otherEntityField = rel.otherEntityField || 'name';
      // Determine if relationship is required
      var relationshipRequired = rel.relationshipRequired || false;
      return __assign(__assign({}, rel), {
        // Original relationship properties
        otherEntityName: otherEntityName,
        relationshipName: relationshipName,
        relationshipFieldName: relationshipFieldName,
        relationshipFieldNamePlural: relationshipFieldNamePlural,
        relationshipNameHumanized: _this.humanize(relationshipName),
        relationshipRequired: relationshipRequired,
        collection: isCollection,
        otherEntityField: otherEntityField,
        // Computed other entity properties
        otherEntity: {
          entityName: otherEntityName,
          entityClass: otherEntityClass,
          entityClassPlural: otherEntityClassPlural,
          entityInstance: otherEntityInstance,
          entityInstancePlural: otherEntityInstancePlural,
          entityFileName: otherEntityFileName,
          entityNamePlural: otherEntityInstancePlural,
          primaryKey: { name: 'id' }, // Default primary key
          builtInUser: rel.relationshipWithBuiltInEntity || false,
        },
      });
    });
  };
  /**
   * Get unique other entities for API imports
   */
  NextJsGenerator.prototype.getUniqueOtherEntities = function (relationships) {
    var entityMap = new Map();
    relationships.forEach(function (rel) {
      var otherEntity = rel.otherEntity;
      if (!entityMap.has(otherEntity.entityName)) {
        entityMap.set(otherEntity.entityName, otherEntity);
      }
    });
    return Array.from(entityMap.values());
  };
  /**
   * Convert camelCase to kebab-case
   */
  NextJsGenerator.prototype.camelToKebab = function (str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  };
  /**
   * Convert first letter to uppercase
   */
  NextJsGenerator.prototype.upperFirstCamelCase = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  /**
   * Convert first letter to lowercase
   */
  NextJsGenerator.prototype.lowerFirstCamelCase = function (str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  };
  /**
   * Convert camelCase or PascalCase to Human Case
   */
  NextJsGenerator.prototype.humanize = function (str) {
    return (
      str
        // Split camelCase
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        // uppercase first letter
        .replace(/^./, function (s) {
          return s.toUpperCase();
        })
    );
  };
  return NextJsGenerator;
})();
exports.NextJsGenerator = NextJsGenerator;
// CLI script to generate components
if (require.main === module) {
  (function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var projectRoot, jhipsterDir, templateDir, outputDir, generator, entityName, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 5, , 6]);
            projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
            jhipsterDir = path.join(projectRoot, '.jhipster');
            templateDir = path.join(projectRoot, 'codgen', 'nextjs', 'templates');
            outputDir = path.join(projectRoot, 'src');
            console.log('Using paths:');
            console.log('- Project root:', projectRoot);
            console.log('- JHipster directory:', jhipsterDir);
            console.log('- Template directory:', templateDir);
            console.log('- Output directory:', outputDir);
            generator = new NextJsGenerator(projectRoot, jhipsterDir, templateDir, outputDir);
            entityName = process.argv[2];
            if (!entityName) return [3 /*break*/, 2];
            return [4 /*yield*/, generator.generateEntity(entityName)];
          case 1:
            _a.sent();
            return [3 /*break*/, 4];
          case 2:
            return [4 /*yield*/, generator.generateAll()];
          case 3:
            _a.sent();
            _a.label = 4;
          case 4:
            return [3 /*break*/, 6];
          case 5:
            error_1 = _a.sent();
            console.error('Error generating components:', error_1);
            process.exit(1);
            return [3 /*break*/, 6];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  })();
}
