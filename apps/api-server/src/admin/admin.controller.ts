// << 🔥 1. IMPORTAR 'Patch', 'Delete', 'Param' 🔥 >>
import { Controller, Get, Post, Body, UseGuards, Patch, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; 
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
// << 🔥 2. IMPORTAR O NOVO DTO 🔥 >>
import { UpdateRoleDto } from './dto/update-role.dto';

@UseGuards(AuthGuard(), AdminGuard)
@Controller('admin') 
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('system-status')
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  // --- Endpoints de Símbolos (Ficam iguais) ---
  @Get('binance-symbols')
  async getBinanceSymbols() {
    return this.adminService.getBinanceSymbols();
  }

  @Get('tracked-symbols')
  async getTrackedSymbols() {
    return this.adminService.getTrackedSymbols();
  }

  @Post('tracked-symbols')
  async addTrackedSymbol(@Body('symbol') symbol: string) {
    return this.adminService.addTrackedSymbol(symbol);
  }

  // << 🔥 3. ADICIONAR NOVOS ENDPOINTS DE UTILIZADOR 🔥 >>
  
  /**
   * Endpoint para listar todos os utilizadores.
   */
  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  /**
   * Endpoint para atualizar o 'role' de um utilizador.
   */
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(id, updateRoleDto);
  }

  /**
   * Endpoint para apagar um utilizador.
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('force-fill')
  async forceFillGaps(
    @Body('symbol') symbol: string,
    @Body('startDate') startDate: string, // Vem como string ISO do frontend
    @Body('endDate') endDate: string,
  ) {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    
    return this.adminService.forceFillGaps(symbol, startMs, endMs);
  }

  @Post('force-fill-all')
  async forceFillAllGaps(
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ) {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    
    // Chama a nova função de serviço
    return this.adminService.forceFillAllGaps(startMs, endMs);
  }
}