<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

abstract class ApiResource extends JsonResource
{
    /** Sem o envelope "data": o contrato devolve o objeto direto. */
    public static $wrap = null;
}
