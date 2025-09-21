import { Controller, Get, Post, Param, Headers, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('n8n')
export class N8nController {
  private readonly n8nApiUrl: string;
  private readonly n8nApiKey: string;

  constructor(private configService: ConfigService) {
    this.n8nApiUrl = this.configService.get<string>('N8N_API_URL');
    this.n8nApiKey = this.configService.get<string>('N8N_API_KEY');
  }

  @Get('workflows')
  async getWorkflows() {
    try {
      const response = await fetch(`${this.n8nApiUrl}/workflows`, {
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new HttpException(
          `N8N API error: ${response.status} ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('workflows/:id')
  async getWorkflow(@Param('id') id: string) {
    try {
      const response = await fetch(`${this.n8nApiUrl}/workflows/${id}`, {
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new HttpException(
          `N8N API error: ${response.status} ${response.statusText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('workflows/:id/toggle')
  async toggleWorkflow(@Param('id') id: string, @Body() body: { active: boolean }) {
    try {
      // Use the native n8n endpoints for activation/deactivation
      const endpoint = body.active ? 'activate' : 'deactivate';
      
      const response = await fetch(`${this.n8nApiUrl}/workflows/${id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `N8N API error: ${response.status} ${response.statusText} - ${errorText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        `Failed to toggle workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('workflows/:id/activate')
  async activateWorkflow(@Param('id') id: string) {
    try {
      // Get current workflow to merge with new active state
      const currentWorkflow = await this.getWorkflow(id);
      
      const response = await fetch(`${this.n8nApiUrl}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...currentWorkflow,
          active: true 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `N8N API error: ${response.status} ${response.statusText} - ${errorText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        `Failed to activate workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('workflows/:id/deactivate')
  async deactivateWorkflow(@Param('id') id: string) {
    try {
      // Get current workflow to merge with new active state
      const currentWorkflow = await this.getWorkflow(id);
      
      const response = await fetch(`${this.n8nApiUrl}/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...currentWorkflow,
          active: false 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `N8N API error: ${response.status} ${response.statusText} - ${errorText}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        `Failed to deactivate workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      const response = await fetch(`${this.n8nApiUrl.replace('/api/v1', '')}/healthz`);
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        statusCode: response.status,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}
