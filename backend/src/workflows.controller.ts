import { Controller, Get } from '@nestjs/common';

@Controller('workflows')
export class WorkflowsController {
  @Get()
  async getWorkflows() {
    return {
      status: 'success',
      data: [
        {
          id: 1,
          name: 'Order Processing Workflow',
          active: true,
          lastRun: new Date().toISOString()
        }
      ],
      total: 1
    };
  }
}
