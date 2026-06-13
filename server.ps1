$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server started at http://localhost:8080"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") {
        $localPath = "/index.html"
    }
    
    $filePath = Join-Path (Get-Location) $localPath.TrimStart("/")
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $response.ContentLength64 = [System.Text.Encoding]::UTF8.GetByteCount($content)
        
        if ($filePath.EndsWith(".js")) {
            $response.ContentType = "text/javascript"
        } elseif ($filePath.EndsWith(".css")) {
            $response.ContentType = "text/css"
        } else {
            $response.ContentType = "text/html"
        }
        
        $response.OutputStream.Write([System.Text.Encoding]::UTF8.GetBytes($content), 0, [System.Text.Encoding]::UTF8.GetByteCount($content))
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}