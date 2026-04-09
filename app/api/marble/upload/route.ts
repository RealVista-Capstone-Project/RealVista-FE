import { NextRequest, NextResponse } from 'next/server';

const MARBLE_API_KEY = process.env.MARBLE_API_KEY;

export async function POST(req: NextRequest) {
  if (!MARBLE_API_KEY) {
    return NextResponse.json(
      { error: 'MARBLE_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const extension = fileName.split('.').pop() || 'jpg';

    // 1. Prepare Upload
    const prepareRes = await fetch('https://api.worldlabs.ai/marble/v1/media-assets:prepare_upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'WLT-Api-Key': MARBLE_API_KEY,
      },
      body: JSON.stringify({
        file_name: fileName,
        kind: 'image',
        extension: extension,
      }),
    });

    if (!prepareRes.ok) {
      const errorData = await prepareRes.text();
      console.error('Marble prepare-upload failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to prepare upload to World Labs', details: errorData },
        { status: prepareRes.status }
      );
    }

    const { media_asset, upload_info } = await prepareRes.json();

    // 2. Upload file content to signed URL (PUT)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(upload_info.upload_url, {
      method: upload_info.upload_method || 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
        ...upload_info.required_headers,
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.text();
      console.error('Marble signed-url PUT failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload file to World Labs storage', details: errorData },
        { status: uploadRes.status }
      );
    }

    // 3. Return the media_asset_id
    return NextResponse.json({
      media_asset_id: media_asset.media_asset_id,
      media_asset: media_asset
    });
  } catch (error: any) {
    console.error('Marble proxy upload error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
