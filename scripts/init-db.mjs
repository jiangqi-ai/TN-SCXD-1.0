import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initializeDatabase() {
  try {
    console.log('开始初始化攀岩设备下单系统数据库...')
    
    // 检查数据库连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 检查是否已有管理员用户
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (!adminUser) {
      // 创建默认管理员用户
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@climbing-gear.com',
          password: 'admin123', // 在实际应用中应该加密
          role: 'admin',
          name: '系统管理员',
          company: '攀岩设备商城',
          phone: '13800138000',
          address: '上海市浦东新区攀岩大厦',
          isActive: true
        }
      })
      console.log('✅ 创建默认管理员用户')
    }

    // 创建示例攀岩设备产品
    const productCount = await prisma.product.count()
    
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: '专业动态绳 10.2mm',
          category: 'rope',
          brand: 'Mammut',
          model: 'Infinity Dry',
          description: '高质量的动态攀岩绳，适合运动攀岩和传统攀岩',
          specifications: JSON.stringify({
            diameter: '10.2mm',
            length: '60m',
            dynamicElongation: '8.9%',
            staticElongation: '8.5%',
            weight: '63g/m'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 1299.00,
          stock: 50,
          weight: 3780,
          size: '10.2mm x 60m',
          colors: JSON.stringify(['红色', '蓝色', '绿色']),
          features: JSON.stringify(['防水处理', 'UIAA认证', '耐磨外皮']),
          certifications: JSON.stringify(['UIAA', 'CE']),
          isActive: true,
          isFeatured: true,
          minOrderQty: 1
        },
        {
          name: '全身式安全带',
          category: 'harness',
          brand: 'Black Diamond',
          model: 'Solution',
          description: '舒适且功能齐全的攀岩安全带',
          specifications: JSON.stringify({
            material: '尼龙',
            buckleType: '双扣',
            gearLoops: 4,
            weight: '395g'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 599.00,
          stock: 30,
          weight: 395,
          size: 'S/M/L/XL',
          colors: JSON.stringify(['黑色', '蓝色']),
          features: JSON.stringify(['透气腰带', '可调节腿环', '装备环']),
          certifications: JSON.stringify(['UIAA', 'CE']),
          isActive: true,
          isFeatured: true,
          minOrderQty: 1
        },
        {
          name: '攀岩鞋',
          category: 'shoes',
          brand: 'La Sportiva',
          model: 'Python',
          description: '高性能攀岩鞋，适合各种难度的攀岩',
          specifications: JSON.stringify({
            closure: '魔术贴',
            sole: 'Vibram XS Edge',
            upper: '真皮',
            weight: '230g'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 899.00,
          stock: 25,
          weight: 460,
          size: 'EU 36-46',
          colors: JSON.stringify(['黑色', '橙色']),
          features: JSON.stringify(['精确贴合', '优秀摩擦力', '耐用鞋底']),
          certifications: JSON.stringify(['CE']),
          isActive: true,
          isFeatured: false,
          minOrderQty: 1
        },
        {
          name: '丝扣主锁',
          category: 'carabiner',
          brand: 'Petzl',
          model: 'William Screw-Lock',
          description: '大开口丝扣主锁，适合多种连接需求',
          specifications: JSON.stringify({
            gate: '25mm',
            strength: '23kN',
            weight: '75g',
            opening: 'screw-lock'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 89.00,
          stock: 100,
          weight: 75,
          size: '25mm开口',
          colors: JSON.stringify(['银色']),
          features: JSON.stringify(['大开口', '防意外开启', '轻量化']),
          certifications: JSON.stringify(['UIAA', 'CE']),
          isActive: true,
          isFeatured: false,
          minOrderQty: 1
        },
        {
          name: '攀岩头盔',
          category: 'helmet',
          brand: 'Mammut',
          model: 'Wall Rider',
          description: '轻量化攀岩头盔，提供全面保护',
          specifications: JSON.stringify({
            weight: '200g',
            ventilation: '14个通风孔',
            adjustment: '旋钮调节',
            certification: 'UIAA'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 459.00,
          stock: 20,
          weight: 200,
          size: 'S/M/L',
          colors: JSON.stringify(['白色', '蓝色', '红色']),
          features: JSON.stringify(['轻量化', '良好通风', '舒适佩戴']),
          certifications: JSON.stringify(['UIAA', 'CE']),
          isActive: true,
          isFeatured: false,
          minOrderQty: 1
        },
        {
          name: '镁粉包',
          category: 'chalk',
          brand: 'Black Diamond',
          model: 'White Gold',
          description: '高品质镁粉，增强抓握力',
          specifications: JSON.stringify({
            weight: '200g',
            type: '块状镁粉',
            purity: '99%',
            packaging: '防潮包装'
          }),
          images: JSON.stringify(['/api/placeholder/400/300']),
          price: 39.00,
          stock: 200,
          weight: 200,
          size: '200g',
          colors: JSON.stringify(['白色']),
          features: JSON.stringify(['高纯度', '防潮包装', '易碎块状']),
          certifications: JSON.stringify([]),
          isActive: true,
          isFeatured: false,
          minOrderQty: 1
        }
      ]

      for (const product of sampleProducts) {
        await prisma.product.create({ data: product })
      }
      console.log('✅ 创建攀岩设备产品数据')
    }

    // 创建系统默认设置
    const defaultSettings = [
      {
        key: 'system_name',
        value: '攀岩设备下单系统',
        description: '系统名称',
        isPublic: true
      },
      {
        key: 'system_version',
        value: '1.0.0',
        description: '系统版本',
        isPublic: true
      },
      {
        key: 'product_categories',
        value: JSON.stringify([
          { key: 'rope', name: '攀岩绳' },
          { key: 'harness', name: '安全带' },
          { key: 'shoes', name: '攀岩鞋' },
          { key: 'helmet', name: '头盔' },
          { key: 'carabiner', name: '主锁/快挂' },
          { key: 'quickdraw', name: '快挂' },
          { key: 'chalk', name: '镁粉' },
          { key: 'bag', name: '装备包' },
          { key: 'other', name: '其他设备' }
        ]),
        description: '产品类别',
        isPublic: true
      },
      {
        key: 'payment_methods',
        value: JSON.stringify([
          { key: 'cod', name: '货到付款' },
          { key: 'transfer', name: '银行转账' },
          { key: 'online', name: '在线支付' }
        ]),
        description: '支付方式',
        isPublic: true
      },
      {
        key: 'shipping_info',
        value: JSON.stringify({
          freeShippingThreshold: 299,
          standardShipping: 15,
          expressShipping: 25
        }),
        description: '运费信息',
        isPublic: true
      }
    ]

    for (const setting of defaultSettings) {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: setting.key }
      })
      
      if (!existingSetting) {
        await prisma.setting.create({ data: setting })
      }
    }
    console.log('✅ 创建系统默认设置')

    console.log('✅ 攀岩设备下单系统初始化完成！')
    console.log('默认管理员账号: admin / admin123')
    console.log('系统已准备就绪，可以开始下单购买攀岩设备了！')
    
    return true
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    console.error('错误详情:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
initializeDatabase().then((success) => {
  process.exit(success ? 0 : 1)
}) 