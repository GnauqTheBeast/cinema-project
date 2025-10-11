package datastore

import (
	"context"
	"fmt"
	"time"

	"migrate-cmd/models"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

func SeedRoles(ctx context.Context, db *bun.DB) error {
	roles := []*models.Role{
		{
			Id:          uuid.New().String(),
			Name:        "admin",
			Description: stringPtr("System administrator with full access"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "manager_staff",
			Description: stringPtr("Cinema manager staff"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "ticket_staff",
			Description: stringPtr("Cinema ticket staff"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "customer",
			Description: stringPtr("Regular customer"),
			CreatedAt:   time.Now(),
		},
	}

	_, err := db.NewInsert().Model(&roles).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed roles: %w", err)
	}

	fmt.Println("Roles seeded successfully!")
	return nil
}

func SeedPermissions(ctx context.Context, db *bun.DB) error {
	permissions := []*models.Permission{
		{
			Id:          uuid.New().String(),
			Name:        "Movie Manage",
			Code:        "movie_manage",
			Description: stringPtr("Manage movies (create, update, delete)"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Showtime Manage",
			Code:        "showtime_manage",
			Description: stringPtr("Manage movie showtimes"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Seat Manage",
			Code:        "seat_manage",
			Description: stringPtr("Manage cinema seats"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Report View",
			Code:        "report_view",
			Description: stringPtr("View analytics and operational reports"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Profile View",
			Code:        "profile_view",
			Description: stringPtr("View profile details"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Profile Update",
			Code:        "profile_update",
			Description: stringPtr("Update profile details"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Booking Create",
			Code:        "booking_create",
			Description: stringPtr("Create bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Booking Manage",
			Code:        "booking_manage",
			Description: stringPtr("Manage bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket Issue",
			Code:        "ticket_issue",
			Description: stringPtr("Issue or print tickets"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Payment Process",
			Code:        "payment_process",
			Description: stringPtr("Handle payments for bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket View",
			Code:        "ticket_view",
			Description: stringPtr("View tickets"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Staff Manage",
			Code:        "staff_manage",
			Description: stringPtr("Manage staff accounts"),
			CreatedAt:   time.Now(),
		},
	}

	_, err := db.NewInsert().Model(&permissions).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed permissions: %w", err)
	}

	fmt.Println("Permissions seeded successfully!")
	return nil
}

func SeedRolePermissions(ctx context.Context, db *bun.DB) error {
	// Fetch roles
	var roles []models.Role
	if err := db.NewSelect().Model(&roles).Scan(ctx); err != nil {
		return fmt.Errorf("failed to get roles: %w", err)
	}

	// Fetch permissions
	var permissions []models.Permission
	if err := db.NewSelect().Model(&permissions).Scan(ctx); err != nil {
		return fmt.Errorf("failed to get permissions: %w", err)
	}

	if len(roles) == 0 || len(permissions) == 0 {
		return fmt.Errorf("roles or permissions missing; seed roles and permissions first")
	}

	// Build lookup maps
	roleNameToId := map[string]string{}
	for _, r := range roles {
		roleNameToId[r.Name] = r.Id
	}

	permCodeToId := map[string]string{}
	for _, p := range permissions {
		permCodeToId[p.Code] = p.Id
	}

	// Group permissions per role per the specification
	allCodes := []string{}
	for code := range permCodeToId {
		allCodes = append(allCodes, code)
	}

	managerStaffCodes := []string{
		"movie_manage",
		"showtime_manage",
		"seat_manage",
		"report_view",
		"profile_view",
		"profile_update",
	}

	ticketStaffCodes := []string{
		"booking_create",
		"booking_manage",
		"ticket_issue",
		"payment_process",
		"ticket_view",
		"profile_view",
		"profile_update",
	}

	customerCodes := []string{
		"booking_create",
		"booking_manage",
		"ticket_view",
		"profile_view",
		"profile_update",
	}

	var rolePerms []*models.RolePermission

	// Admin -> all permissions
	if adminId, ok := roleNameToId["admin"]; ok {
		for _, code := range allCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: adminId, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Manager staff
	if rid, ok := roleNameToId["manager_staff"]; ok {
		for _, code := range managerStaffCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Ticket staff
	if rid, ok := roleNameToId["ticket_staff"]; ok {
		for _, code := range ticketStaffCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Customer
	if rid, ok := roleNameToId["customer"]; ok {
		for _, code := range customerCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	if len(rolePerms) == 0 {
		return fmt.Errorf("no role-permission mappings to insert; check roles/permissions")
	}

	if _, err := db.NewInsert().Model(&rolePerms).Exec(ctx); err != nil {
		return fmt.Errorf("failed to seed role_permissions: %w", err)
	}

	fmt.Println("Role permissions seeded successfully!")
	return nil
}

func SeedMovies(ctx context.Context, db *bun.DB) error {
	now := time.Now()
	releaseDate1 := time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC)
	releaseDate2 := time.Date(2024, 4, 20, 0, 0, 0, 0, time.UTC)
	releaseDate3 := time.Date(2024, 5, 10, 0, 0, 0, 0, time.UTC)

	movies := []*models.Movie{
		{
			Id:          uuid.New().String(),
			Title:       "Avengers: Endgame",
			Director:    "Anthony Russo, Joe Russo",
			Cast:        "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth",
			Genre:       "Action, Adventure, Drama",
			Duration:    181,
			ReleaseDate: &releaseDate1,
			Description: "After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos.",
			TrailerURL:  "https://www.youtube.com/watch?v=TcMBFSGVi1c",
			PosterURL:   "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
			Status:      "showing",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Spider-Man: No Way Home",
			Director:    "Jon Watts",
			Cast:        "Tom Holland, Zendaya, Benedict Cumberbatch, Jacob Batalon",
			Genre:       "Action, Adventure, Sci-Fi",
			Duration:    148,
			ReleaseDate: &releaseDate2,
			Description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
			TrailerURL:  "https://www.youtube.com/watch?v=JfVOs4VSpmA",
			PosterURL:   "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
			Status:      "showing",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Top Gun: Maverick",
			Director:    "Joseph Kosinski",
			Cast:        "Tom Cruise, Miles Teller, Jennifer Connelly, Jon Hamm",
			Genre:       "Action, Drama",
			Duration:    130,
			ReleaseDate: &releaseDate3,
			Description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission.",
			TrailerURL:  "https://www.youtube.com/watch?v=g4U4BQW9OEk",
			PosterURL:   "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
			Status:      "upcoming",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Dune",
			Director:    "Denis Villeneuve",
			Cast:        "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac, Josh Brolin",
			Genre:       "Action, Adventure, Drama, Sci-Fi",
			Duration:    155,
			ReleaseDate: &releaseDate1,
			Description: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.",
			TrailerURL:  "https://www.youtube.com/watch?v=8g18jFHCLXk",
			PosterURL:   "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
			Status:      "showing",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "The Batman",
			Director:    "Matt Reeves",
			Cast:        "Robert Pattinson, Zoë Kravitz, Paul Dano, Jeffrey Wright",
			Genre:       "Action, Crime, Drama",
			Duration:    176,
			ReleaseDate: &releaseDate2,
			Description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
			TrailerURL:  "https://www.youtube.com/watch?v=mqqft2x_Aa4",
			PosterURL:   "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
			Status:      "showing",
			CreatedAt:   &now,
		},
	}

	_, err := db.NewInsert().Model(&movies).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed movies: %w", err)
	}

	fmt.Println("Movies seeded successfully!")
	return nil
}

func SeedRooms(ctx context.Context, db *bun.DB) error {
	now := time.Now()
	rooms := []*models.Room{
		{
			Id:         uuid.New().String(),
			RoomNumber: 1,
			Capacity:   120,
			RoomType:   "standard",
			Status:     "active",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 2,
			Capacity:   150,
			RoomType:   "standard",
			Status:     "active",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 3,
			Capacity:   200,
			RoomType:   "imax",
			Status:     "active",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 4,
			Capacity:   80,
			RoomType:   "vip",
			Status:     "active",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 5,
			Capacity:   100,
			RoomType:   "4dx",
			Status:     "active",
			CreatedAt:  now,
		},
	}

	_, err := db.NewInsert().Model(&rooms).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed rooms: %w", err)
	}

	fmt.Println("Rooms seeded successfully!")
	return nil
}

func SeedUsers(ctx context.Context, db *bun.DB) error {
	// Get role IDs first
	var roles []models.Role
	err := db.NewSelect().Model(&roles).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get roles: %w", err)
	}

	if len(roles) == 0 {
		return fmt.Errorf("no roles found, please seed roles first")
	}

	var adminRoleId, managerStaffRoleId, ticketStaffRoleId, customerRoleId string
	for _, role := range roles {
		switch role.Name {
		case "admin":
			adminRoleId = role.Id
		case "manager_staff":
			managerStaffRoleId = role.Id
		case "ticket_staff":
			ticketStaffRoleId = role.Id
		case "customer":
			customerRoleId = role.Id
		}
	}

	now := time.Now()
	users := []*models.User{
		{
			Id:          uuid.New().String(),
			Name:        "Admin User",
			Email:       "admin@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567890"),
			RoleId:      &adminRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "active",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Manager Staff",
			Email:       "manager@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567891"),
			RoleId:      &managerStaffRoleId,
			Address:     stringPtr("123 Manager Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "active",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket Staff",
			Email:       "ticket@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567892"),
			RoleId:      &ticketStaffRoleId,
			Address:     stringPtr("123 Ticket Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "active",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Alice",
			Email:       "alice@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			Address:     stringPtr("123 Alice Street"),
			PhoneNumber: stringPtr("+1234567893"),
			RoleId:      &customerRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "female",
			Status:      "active",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Bob",
			Email:       "bob@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567893"),
			Address:     stringPtr("123 Bob Street"),
			RoleId:      &customerRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "active",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Emma Wilson",
			Email:       "emma@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567894"),
			RoleId:      &customerRoleId,
			Address:     stringPtr("123 Emma Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "female",
			Status:      "active",
			CreatedAt:   now,
		},
	}

	_, err = db.NewInsert().Model(&users).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}

	fmt.Println("Users seeded successfully!")
	return nil
}

func SeedNotifications(ctx context.Context, db *bun.DB) error {
	var users []models.User
	err := db.NewSelect().Model(&users).Limit(3).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}

	if len(users) == 0 {
		return fmt.Errorf("no users found, please seed users first")
	}

	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)

	notifications := []*models.Notification{
		{
			Id:        uuid.New().String(),
			UserId:    users[0].Id,
			Title:     "Welcome to Cinema",
			Content:   "Thank you for joining our cinema! Enjoy your movie experience.",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[1].Id,
			Title:     "New Movie Release",
			Content:   "Spider-Man: No Way Home is now showing! Book your tickets now.",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[2].Id,
			Title:     "Special Offer",
			Content:   "Get 20% off on weekend bookings! Use code WEEKEND20",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[0].Id,
			Title:     "Booking Confirmation",
			Content:   "Your booking for Avengers: Endgame has been confirmed.",
			Status:    models.NotificationStatusRead,
			CreatedAt: &yesterday,
			UpdatedAt: &yesterday,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[1].Id,
			Title:     "System Maintenance",
			Content:   "System will be under maintenance on Sunday from 2 AM to 4 AM.",
			Status:    models.NotificationStatusPending,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
	}

	_, err = db.NewInsert().Model(&notifications).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed notifications: %w", err)
	}

	fmt.Println("Notifications seeded successfully!")
	return nil
}

func stringPtr(s string) *string {
	return &s
}

func SeedSeats(ctx context.Context, db *bun.DB) error {
	var rooms []models.Room
	err := db.NewSelect().Model(&rooms).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get rooms: %w", err)
	}

	if len(rooms) == 0 {
		return fmt.Errorf("no rooms found, please seed rooms first")
	}

	now := time.Now()
	var seats []*models.Seat

	seatConfigs := map[string]struct {
		rows        []string
		seatsPerRow int
		regularRows []string
		vipRows     []string
		coupleRows  []string
	}{
		"standard": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"},
			seatsPerRow: 8,
			regularRows: []string{"A", "B", "C", "D", "E"},
			vipRows:     []string{"F", "G", "H", "I", "J", "K", "L"},
			coupleRows:  []string{},
		},
		"imax": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"},
			seatsPerRow: 14,
			regularRows: []string{"A", "B", "C", "D", "E"},
			vipRows:     []string{"F", "G", "H", "I", "J", "K", "L"},
			coupleRows:  []string{"M", "N", "O"},
		},
		"vip": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"},
			seatsPerRow: 8,
			regularRows: []string{"A", "B", "C"},
			vipRows:     []string{"D", "E", "F", "G", "H"},
			coupleRows:  []string{"I", "J"},
		},
		"4dx": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H"},
			seatsPerRow: 12,
			regularRows: []string{},
			vipRows:     []string{},
			coupleRows:  []string{},
		},
	}

	for _, room := range rooms {
		config, exists := seatConfigs[room.RoomType]
		if !exists {
			continue
		}

		for _, row := range config.rows {
			for seatNum := 1; seatNum <= config.seatsPerRow; seatNum++ {
				seatType := "regular"

				for _, regularRow := range config.regularRows {
					if row == regularRow {
						seatType = "regular"
						break
					}
				}

				for _, vipRow := range config.vipRows {
					if row == vipRow {
						seatType = "vip"
						break
					}
				}

				for _, coupleRow := range config.coupleRows {
					if row == coupleRow {
						seatType = "couple"
						break
					}
				}

				if room.RoomType == "4dx" {
					seatType = "4dx"
				}

				seat := &models.Seat{
					Id:         uuid.New().String(),
					RoomId:     room.Id,
					SeatNumber: fmt.Sprintf("%02d", seatNum),
					RowNumber:  row,
					SeatType:   seatType,
					Status:     "available",
					CreatedAt:  now,
				}
				seats = append(seats, seat)

				if seatType == "couple" && room.RoomType != "4dx" {
					seatNum++
					if seatNum <= config.seatsPerRow {
						coupleSeat := &models.Seat{
							Id:         uuid.New().String(),
							RoomId:     room.Id,
							SeatNumber: fmt.Sprintf("%02d", seatNum),
							RowNumber:  row,
							SeatType:   seatType,
							Status:     "available",
							CreatedAt:  now,
						}
						seats = append(seats, coupleSeat)
					}
				}
			}
		}
	}

	batchSize := 500
	for i := 0; i < len(seats); i += batchSize {
		end := i + batchSize
		if end > len(seats) {
			end = len(seats)
		}

		batch := seats[i:end]
		_, err = db.NewInsert().Model(&batch).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to seed seats batch %d-%d: %w", i, end, err)
		}
	}

	fmt.Printf("Seats seeded successfully! Total: %d seats\n", len(seats))
	return nil
}

func SeedShowtimes(ctx context.Context, db *bun.DB) error {
	// Get all movies and rooms first
	var movies []models.Movie
	var rooms []models.Room

	err := db.NewSelect().Model(&movies).Where("status IN (?)", bun.In([]string{"showing", "upcoming"})).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get movies: %w", err)
	}

	err = db.NewSelect().Model(&rooms).Where("status = ?", "active").Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get rooms: %w", err)
	}

	if len(movies) == 0 {
		return fmt.Errorf("no movies found, please seed movies first")
	}

	if len(rooms) == 0 {
		return fmt.Errorf("no rooms found, please seed rooms first")
	}

	now := time.Now()
	var showtimes []*models.Showtime

	// Price configuration based on room type and time
	priceConfig := map[string]map[string]float64{
		"standard": {
			"morning":   80000,
			"afternoon": 100000,
			"evening":   120000,
		},
		"vip": {
			"morning":   150000,
			"afternoon": 180000,
			"evening":   220000,
		},
		"imax": {
			"morning":   120000,
			"afternoon": 150000,
			"evening":   180000,
		},
		"4dx": {
			"morning":   200000,
			"afternoon": 250000,
			"evening":   300000,
		},
	}

	// Time slots for different periods
	timeSlots := map[string][]string{
		"morning":   {"09:00", "11:30"},
		"afternoon": {"14:00", "16:30"},
		"evening":   {"19:00"},
	}

	for day := 0; day < 2; day++ {
		currentDate := now.AddDate(0, 0, day)

		for _, movie := range movies {
			for _, room := range rooms {
				formats := make([]string, 0)
				switch room.RoomType {
				case "imax":
					formats = []string{"2d", "3d", "imax"}
				case "4dx":
					formats = []string{"4dx"}
				case "standard", "vip":
					formats = []string{"2d", "3d"}
				}

				for _, format := range formats {
					if day%2 == 0 && format == "3d" {
						continue
					}
					if day%3 == 0 && format == "imax" {
						continue
					}

					for period, times := range timeSlots {
						for _, timeStr := range times {
							startTime, err := time.Parse("15:04", timeStr)
							if err != nil {
								continue
							}

							showtimeStart := time.Date(
								currentDate.Year(), currentDate.Month(), currentDate.Day(),
								startTime.Hour(), startTime.Minute(), 0, 0, currentDate.Location(),
							)

							showtimeEnd := showtimeStart.Add(time.Duration(movie.Duration+30) * time.Minute)

							basePrice := priceConfig[room.RoomType][period]

							switch format {
							case "3d":
								basePrice += 20000
							case "imax":
								basePrice += 50000
							case "4dx":
								// 4dx price is already set in config
							}

							status := "scheduled"
							if showtimeStart.Before(now) {
								if showtimeEnd.Before(now) {
									status = "completed"
								} else {
									status = "ongoing"
								}
							}

							showtime := &models.Showtime{
								Id:        uuid.New().String(),
								MovieId:   movie.Id,
								RoomId:    room.Id,
								StartTime: showtimeStart,
								EndTime:   showtimeEnd,
								Format:    format,
								BasePrice: basePrice,
								Status:    status,
								CreatedAt: now,
							}
							showtimes = append(showtimes, showtime)
						}
					}
				}
			}
		}
	}

	batchSize := 100
	for i := 0; i < len(showtimes); i += batchSize {
		end := i + batchSize
		if end > len(showtimes) {
			end = len(showtimes)
		}

		batch := showtimes[i:end]
		_, err = db.NewInsert().Model(&batch).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to seed showtimes batch %d-%d: %w", i, end, err)
		}
	}

	fmt.Printf("Showtimes seeded successfully! Total: %d showtimes\n", len(showtimes))
	return nil
}
