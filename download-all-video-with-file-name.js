/**
 * Douyin_download_all_video
 * A utility script to download videos directly from DouYin user profiles with video titles as filenames
 */

const getid = async function(sec_user_id, max_cursor) {
    const url = `https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=${sec_user_id}&max_cursor=${max_cursor}&count=20&version_code=170400&version_name=17.4.0`;
    
    try {
        const res = await fetch(url, {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "vi",
                "sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"118\", \"Microsoft Edge\";v=\"118\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.0.0"
            },
            "referrer": `https://www.douyin.com/user/${sec_user_id}`,
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        });
        
        if (!res.ok) {
            console.log(`HTTP Error: ${res.status}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await getid(sec_user_id, max_cursor);
        }
        
        return await res.json();
    } catch (e) {
        console.log("Data loading error:", e);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await getid(sec_user_id, max_cursor);
    }
};

const sanitizeFilename = function(str) {
    // Loại bỏ ký tự không hợp lệ trong tên file và giới hạn độ dài
    return str
        .replace(/[<>:"/\\|?*]/g, '') // Loại bỏ ký tự không hợp lệ
        .replace(/\s+/g, '_')         // Thay khoảng trắng bằng dấu gạch dưới
        .substring(0, 50);            // Giới hạn độ dài tên file (50 ký tự)
};

const downloadVideo = async function(url, title, index) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const sanitizedTitle = sanitizeFilename(title || `douyin_video_${index}`);
        const filename = `${sanitizedTitle}.mp4`;
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(a.href);
        console.log(`Downloaded: ${filename}`);
    } catch (e) {
        console.error(`Error downloading video ${index}:`, e);
    }
};

const run = async function() {
    try {
        let hasMore = 1;
        const sec_user_id = location.pathname.replace("/user/", "");
        
        if (!sec_user_id || location.pathname.indexOf("/user/") === -1) {
            alert("Please run this script on a DouYin user profile page!");
            return;
        }
        
        console.log(`Loading videos from user: ${sec_user_id}`);
        let max_cursor = 0;
        let errorCount = 0;
        let videoCount = 0;

        while (hasMore == 1 && errorCount < 5) {
            try {
                console.log(`Loading more data, max_cursor = ${max_cursor}`);
                const moredata = await getid(sec_user_id, max_cursor);
                
                if (!moredata || !moredata.aweme_list) {
                    console.log("No video data found, retrying...");
                    errorCount++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                
                errorCount = 0;
                hasMore = moredata.has_more;
                max_cursor = moredata.max_cursor;
                
                for (const video of moredata.aweme_list) {
                    let videoUrl = "";
                    
                    if (video.video && video.video.play_addr) {
                        videoUrl = video.video.play_addr.url_list[0];
                    } else if (video.video && video.video.download_addr) {
                        videoUrl = video.video.download_addr.url_list[0];
                    }
                    
                    if (videoUrl) {
                        if (!videoUrl.startsWith("https")) {
                            videoUrl = videoUrl.replace("http", "https");
                        }
                        
                        videoCount++;
                        const videoTitle = video.desc || `douyin_video_${videoCount}`;
                        console.clear();
                        console.log(`Downloading video ${videoCount}: ${videoTitle}`);
                        await downloadVideo(videoUrl, videoTitle, videoCount);
                        
                        // Thêm độ trễ giữa các lần tải để tránh bị chặn
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (e) {
                console.error("Error during loading:", e);
                errorCount++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        if (videoCount > 0) {
            console.log(`Complete! Downloaded ${videoCount} videos.`);
        } else {
            console.log("No videos found or unable to download.");
        }
        
    } catch (e) {
        console.error("Critical error:", e);
        alert(`An error occurred: ${e.message}`);
    }
};

run();
