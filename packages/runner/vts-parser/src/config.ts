import type { Code } from '@el_velo/common';

export const CODES: Record<string, Code> = {
    SUCCESS: {
        id: '0000',
        description: 'Operation completed successfully.',
    },
    VTS_FILES_NOT_FOUND: {
        id: '5001',
        description: 'No VTS files were found in the specified directory.',
    },
    VTS_WRONG_FORMAT: {
        id: '5002',
        description: 'The VTS file format is incorrect or invalid.',
    },
    CANT_ACCESS_VTS_FOLDER: {
        id: '5003',
        description: 'The VTS folder is not accesible'
    },
    ERROR_READING_VTS_FOLDER: {
        id: '5004',
        description: 'Can\'t read VTS folder'
    }
};

export const vtsStepSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsStepSchema',
    title: 'VTSStep',
    description: 'Schema that validates the VTSStep object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the step',
            type: 'string'
        },
        description: {
            description: 'Step\'s description',
            type: 'string'
        },
        type: {
            decription: 'Type of VTSResources. It only can have the value step@X.X.X',
            const: 'step@1.0.0'
        },
        action: {
            description: 'Action to do in the step',
            type: 'string',
            enum: [
                'run-command',
                'write-file',
                'read-file',
                'check-process',
                'get',
                'post',
                'put',
                'delete',
                'navigate',
                'click',
                'fill',
                'press',
                'hover',
                'focus',
                'check',
                'uncheck',
                'select',
                'upload',
                'dragAndDrop',
                'scroll',
                'wait'
            ]
        }
    },
    required: ['id', 'type', 'action', 'description']
};

export const vtsStepGroupSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsStepGroupSchema',
    title: 'vtsStepGroup',
    description: 'Schema that validate VTSStepGroup object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the stepGroup',
            type: 'string'
        },
        description: {
            description: 'StepGroup\'s description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSREsource. It only can have the value step-group@1.0.0',
            const: 'step-group@1.0.0'
        },
        executor: {
            description: 'Executor that must run these steps',
            type: 'string',
            enum: ['cli', 'http', 'playwright']
        },
        stepRefs: {
            description: 'List of step ids that define the steps that make up the step group',
            type: 'array',
            items: {
                type: 'string',
                minContains: 1
            }
        }
    },
    required: ['id', 'description', 'type', 'executor', 'stepRefs']
};

export const vtsContextSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsContextSchema',
    title: 'VTSContext',
    description: 'Schema tat validates the VTSContext object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the context',
            type: 'string'
        },
        description: {
            description: 'Context\'s description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSContext. It only can have the value context@1.0.0',
            const: 'context@1.0.0'
        },
        dockerComposeFilePath: {
            description: 'Path to the docker-compose file to build the test environment',
            type: 'string'
        }
    },
    required: ['id', 'type', 'dockerComposeFilePath']
};

export const vtsExpectationSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsExpectationSchema',
    title: 'vtsExpectation',
    description: 'Schema that validate VTSExpectation object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the expectatio',
            type: 'string'
        },
        description: {
            description: 'Expectation description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSExpectation. It only can have the value expectation@1.0.0',
            const: 'expectation@1.0.0'
        },
        property: {
            description: 'Property from the test result that must be evaluated',
            type: 'string'
        },
        operator: {
            description: 'Operation to apply on the property to check if the test pass',
            type: 'string',
            enum: [
                'equals',
                'not-equals',
                'contains',
                'not-contains',
                'matches',
                'greater-than',
                'less-than',
                'exists',
                'not-exists',
                'is-empty',
                'is-not-empty',
            ]
        },
        expected: {
            description: 'Value to compare with the property value',
        }
    },
    required: ['id', 'description', 'type', 'property', 'operator']
};

export const vtsTestDefinitionSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsTestDefinitionSchema',
    title: 'vtsTestDefinition',
    description: 'Schema that validate the VTSTestDefinition',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the vtsTestDefinitio',
            type: 'string'
        },
        description: {
            description: 'Test definition description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSTestDefinition. It only can have the value test-definition@1.0.0',
            const: 'test-definition@1.0.0'
        },
        tags: {
            description: 'Metadata tags for the test',
            type: 'array',
            items: {
                type: 'string'
            }
        },
        contextRef: {
            description: 'Id for the context use in this test',
            type: 'string'
        },
        stepsGroupRef: {
            description: 'Id for the steps group that define the test',
            type: 'string'
        },
        expectationsRefs: {
            description: 'List of expectation that the test must pass to finish green',
            type: 'array',
            items: {
                type: 'string'
            },
            minContains: 1
        }
    },
    required: ['id','description', 'type', 'constextRef', 'stepsGroupRef', 'expectationsRefs']
};

export const VTSPluginConfigSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsPluginConfig',
    description: 'Schema that validate VTSPluginConfig object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the VTSPlugin',
            type: 'string'
        },
        description: {
            description: 'VTSPlugin description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSPlugin. It only can have the value plugin-config@1.0.0',
            const: 'plugin-config@1.0.0'
        },
        package: {
            description: 'NPM package that points to the plugin',
            type: 'string'
        },
        enabled: {
            description: 'Flat to activate or desactivate the plugin',
            type: 'boolean'
        },
        options: {
            description: 'Plugin configuration params',
            type: 'object'
        }
    },
    required: ['id', 'description', 'type', 'package']
};

export const VTSTestPlanSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'vtsTestPlanSchema',
    title: 'vtsTestPlanSchema',
    description: 'Schema that validate VTSTestPlan object',
    type: 'object',
    properties: {
        id: {
            description: 'Unique id for the vtsTestPlan',
            type: 'string'
        },
        description: {
            description: 'VTSTestPlan\'s description',
            type: 'string'
        },
        type: {
            description: 'Type of VTSTestPlan. It only can have the value test-plan@1.0.0',
            const: 'test-plan@1.0.0'
        },
        tags: {
            description: 'Metadata tags for test plan',
            type: 'array',
            items: {
                type: 'string'
            }
        },
        testsRefs: {
            description: 'List of id for the test definition that conform the test plan',
            type: 'array',
            items: {
                type: 'string',
                minContains: 1
            }
        },
        plugins: {
            description: 'Plugins configuration',
            type: 'object',
            properties: {
                beforeRun: {
                    description: 'List of plugin that will be executed befor to start the test plan',
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                beforeTest: {
                    description: 'List of plugins that will be executed before each test',
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                afterTest: {
                    description: 'List of plugins that will be executed after each test',
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                afterRun: {
                    description: 'List of plugins that will be executed after all the tests have finished',
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            }
        }
    },
    required: ['id', 'description', 'type', 'testRefs']
};